import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"
import { submitRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  submissionId: z.string(),
  problemId: z.string(),
  code: z.string().min(1),
  language: z.enum(["JAVASCRIPT", "TYPESCRIPT", "PYTHON", "JAVA", "CPP"]),
})

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  JAVASCRIPT: 63,
  TYPESCRIPT: 74,
  PYTHON: 71,
  JAVA: 62,
  CPP: 54,
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function executeCode(
  code: string,
  language: string,
  input: string,
  expectedOutput: string
): Promise<{ passed: boolean; actual: string; error?: string }> {
  // submit to Judge0
  const submitRes = await fetch(
    `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY!,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        source_code: code,
        language_id: LANGUAGE_IDS[language],
        stdin: input,
        expected_output: expectedOutput,
      }),
    }
  )

  if (!submitRes.ok) {
    throw new Error(`Judge0 submission failed: ${submitRes.status} ${submitRes.statusText}`)
  }

  const { token } = await submitRes.json()

  // poll for result
  let result = null
  for (let i = 0; i < 10; i++) {
    await sleep(1000)
    const resultRes = await fetch(
      `${process.env.JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY!,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    )
    if (!resultRes.ok) {
      throw new Error(`Judge0 polling failed: ${resultRes.status} ${resultRes.statusText}`)
    }
    result = await resultRes.json()
    // status 1=queued, 2=processing, 3=accepted
    if (result.status?.id > 2) break
  }

  if (!result || !result.status || result.status.id <= 2) {
    return {
      passed: false,
      actual: "",
      error: "Execution timed out. The server took too long to evaluate your code. Please try again.",
    }
  }

  const actual = (result.stdout ?? "").trim()
  const expected = expectedOutput.trim()
  const passed = actual === expected && result.status?.id === 3

  return {
    passed,
    actual,
    error: result.stderr ?? result.compile_output ?? undefined,
  }
}

export const POST = withAuth(async (req, user) => {
  try {
    const raw = await req.json()
    // Gracefully handle clients that accidentally double-stringify the JSON
    const body = typeof raw === "string" ? JSON.parse(raw) : raw
    const { submissionId, problemId, code, language } = schema.parse(body)

    if (submitRateLimit) {
      const { success } = await submitRateLimit.limit(user.userId);
      if (!success) {
        return NextResponse.json(
          { error: "Too many code executions. Please slow down." },
          { status: 429 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Rate limiting is required in production." },
        { status: 500 }
      );
    }

    // verify candidate owns this submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        invite: {
          include: {
            test: true,
          },
        },
      },
    })

    if (!submission || submission.candidateId !== user.userId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    if (submission.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Already submitted" },
        { status: 400 }
      )
    }

    // get problem with test cases AND verify it belongs to this test
    const testProblem = await prisma.testProblem.findUnique({
      where: {
        testId_problemId: {
          testId: submission.invite.testId,
          problemId,
        },
      },
      include: {
        problem: {
          include: { testCases: true },
        },
      },
    })

    if (!testProblem) {
      return NextResponse.json(
        { error: "Problem not found or not part of this test" },
        { status: 404 }
      )
    }

    const problem = testProblem.problem

    // run all test cases
    const results = await Promise.all(
      problem.testCases.map((tc) =>
        executeCode(code, language, tc.input, tc.expected)
      )
    )

    const passed = results.filter((r) => r.passed).length
    const total = results.length

    // calculate tokens used for this specific problem
    const tokenLogs = await prisma.tokenLog.aggregate({
      where: { submissionId, problemId },
      _sum: { tokensUsed: true },
    })
    const problemTokensUsed = tokenLogs._sum.tokensUsed ?? 0

    // save answer
    await prisma.answer.create({
      data: {
        submissionId,
        problemId,
        code,
        language,
        testCasesPassed: passed,
        testCasesTotal: total,
        tokensUsed: problemTokensUsed,
      },
    })

    return NextResponse.json({
      results: {
        passed,
        total,
        percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
        details: results.map((r, i) => ({
          testCase: i + 1,
          passed: r.passed,
          actual: r.actual,
          error: r.error,
        })),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}, "CANDIDATE")