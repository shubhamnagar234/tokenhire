import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"

export const GET = withAuth(async (req, user, context) => {
  const { token: inviteToken } = await context.params

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

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address" },
      { status: 403 }
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
        aiModel: invite.test.aiModel,
        problemCount: invite.test.problems.length,
        problems: invite.status === "PENDING" ? [] : invite.test.problems.map((tp) => ({
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
})