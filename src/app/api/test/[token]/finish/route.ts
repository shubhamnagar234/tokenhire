import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { calculateScore } from "@/lib/scoring";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

const schema = z.object({
  submissionId: z.string(),
});

/** Ask the LLM to rate overall code quality 0–100. Returns undefined on any failure. */
async function getAICodeQualityScore(
  answers: { code: string; language: string }[],
  modelName: string,
): Promise<number | undefined> {
  if (answers.length === 0) return undefined;

  try {
    const llm = new ChatOpenAI({
      modelName: modelName,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      maxTokens: 64,
    });

    const codeBlock = answers
      .map(
        (a, i) =>
          `### Solution ${i + 1} (${a.language})\n\`\`\`\n${a.code.slice(0, 1500)}\n\`\`\``,
      )
      .join("\n\n");

    const messages = [
      new SystemMessage(
        "You are a senior software engineer reviewing candidate code quality. " +
          "Evaluate readability, naming conventions, edge-case handling, and idiomatic style. " +
          'Respond with ONLY a valid JSON object in this exact format: { "score": <integer 0-100> }. ' +
          "No explanation, no markdown, no extra text.",
      ),
      new HumanMessage(
        `Rate the overall code quality of the following candidate solutions:\n\n${codeBlock}`,
      ),
    ];

    const result = await llm.invoke(messages);
    const text = (result.content as string).trim();

    // strip markdown fences if model wraps in ```json ... ```
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.score === "number" &&
      parsed.score >= 0 &&
      parsed.score <= 100
    ) {
      return Math.round(parsed.score);
    }
  } catch {
    // silently fall back — scoring lib uses the proxy formula
  }

  return undefined;
}

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const { submissionId } = schema.parse(body);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        answers: true,
        invite: {
          include: { test: true },
        },
      },
    });

    if (!submission || submission.candidateId !== user.userId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.status === "SUBMITTED") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    const now = new Date();
    const timeUsedMins = Math.round(
      (now.getTime() - submission.startedAt.getTime()) / 60000,
    );

    // aggregate test cases across all answers
    const totalPassed = submission.answers.reduce(
      (sum: number, a: { testCasesPassed: number }) => sum + a.testCasesPassed,
      0,
    );
    const totalCases = submission.answers.reduce(
      (sum: number, a: { testCasesTotal: number }) => sum + a.testCasesTotal,
      0,
    );

    const test = submission.invite.test;

    // ── AI Code Quality Review ────────────────────────────────────────────────
    const modelName = test.aiModel || "google/gemini-2.5-flash:free";
    const codeQualityScore = await getAICodeQualityScore(
      submission.answers.map((a: { code: string; language: string }) => ({
        code: a.code,
        language: a.language,
      })),
      modelName,
    );
    // ─────────────────────────────────────────────────────────────────────────

    // calculate composite score
    const scores = calculateScore({
      testCasesPassed: totalPassed,
      testCasesTotal: totalCases,
      timeUsedMins,
      timeLimitMins: test.timeLimitMins,
      tokensUsed: submission.tokensUsed,
      tokenBudget: submission.tokenBudget,
      weightCorrectness: test.weightCorrectness,
      weightTime: test.weightTime,
      weightTokenSaving: test.weightTokenSaving,
      weightCodeQuality: test.weightCodeQuality,
      codeQualityScore, // passes AI score; undefined → falls back to proxy
    });

    // update submission with final scores
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        timeUsedMins,
        ...scores,
      },
    });

    // mark invite as completed
    await prisma.testInvite.update({
      where: { id: submission.inviteId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({
      message: "Test submitted successfully",
      scores: {
        correctness: scores.scoreCorrectness,
        time: scores.scoreTime,
        tokenSaving: scores.scoreTokenSaving,
        codeQuality: scores.scoreCodeQuality,
        composite: scores.scoreComposite,
      },
      summary: {
        timeUsedMins,
        tokensUsed: submission.tokensUsed,
        tokenBudget: submission.tokenBudget,
        testCasesPassed: totalPassed,
        testCasesTotal: totalCases,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, "CANDIDATE");
