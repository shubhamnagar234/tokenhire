import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const segments = new URL(req.url).pathname.split("/")
  const inviteToken = segments[segments.indexOf("test") + 1]

  const invite = await prisma.testInvite.findUnique({
    where: { token: inviteToken },
    include: {
      test: {
        include: {
          problems: {
            include: {
              problem: {
                include: { testCases: true },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  })

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid invite link" },
      { status: 404 }
    )
  }

  if (invite.status === "COMPLETED") {
    return NextResponse.json(
      { error: "This test has already been completed" },
      { status: 400 }
    )
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "This invite link has expired" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
      test: {
        id: invite.test.id,
        title: invite.test.title,
        description: invite.test.description,
        timeLimitMins: invite.test.timeLimitMins,
        tokenBudget: invite.test.tokenBudget,
        problemCount: invite.test.problems.length,
        problems: invite.test.problems.map((tp) => ({
          id: tp.problem.id,
          title: tp.problem.title,
          description: tp.problem.description,
          difficulty: tp.problem.difficulty,
          tags: tp.problem.tags,
          testCases: tp.problem.testCases
            .filter((tc) => !tc.isHidden)
            .map((tc) => ({
              input: tc.input,
              expected: tc.expected,
            })),
          order: tp.order,
        })),
      },
    },
  })
}