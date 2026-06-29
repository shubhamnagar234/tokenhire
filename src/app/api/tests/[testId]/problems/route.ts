import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"

const schema = z.object({
  problemId: z.string(),
  order: z.number().default(1),
})

export const POST = withAuth(async (req, user) => {
  // extract testId from URL reliably
  const segments = new URL(req.url).pathname.split("/")
  const testId = segments[segments.indexOf("tests") + 1]

  try {
    const body = await req.json()
    const { problemId, order } = schema.parse(body)

    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        company: { users: { some: { id: user.userId } } },
      },
    })

    if (!test) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 403 }
      )
    }

    const testProblem = await prisma.testProblem.create({
      data: { testId, problemId, order },
      include: { problem: true },
    })

    return NextResponse.json({ testProblem })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}, "RECRUITER")