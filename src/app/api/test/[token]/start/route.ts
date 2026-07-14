import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"

export const POST = withAuth(async (req, user, context) => {
  const { token: inviteToken } = await context.params

  const invite = await prisma.testInvite.findUnique({
    where: { token: inviteToken },
    include: { test: true },
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
      { error: "Already completed" },
      { status: 400 }
    )
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "Invite expired" },
      { status: 400 }
    )
  }

  const existing = await prisma.submission.findUnique({
    where: { inviteId: invite.id },
  })

  if (existing) {
    return NextResponse.json({ submission: existing })
  }

  const [submission] = await prisma.$transaction([
    prisma.submission.create({
      data: {
        inviteId: invite.id,
        candidateId: user.userId,
        tokenBudget: invite.test.tokenBudget,
        tokensUsed: 0,
        status: "IN_PROGRESS",
      },
    }),
    prisma.testInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        candidateId: user.userId,
      },
    }),
  ])

  return NextResponse.json({
    submission: {
      id: submission.id,
      tokenBudget: submission.tokenBudget,
      tokensUsed: submission.tokensUsed,
      startedAt: submission.startedAt,
      timeLimitMins: invite.test.timeLimitMins,
    },
  })
}, "CANDIDATE")