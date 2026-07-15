import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"

// GET /api/candidate/tests — returns all invites + submissions for the logged-in candidate
export const GET = withAuth(async (req, user) => {
  const invites = await prisma.testInvite.findMany({
    where: {
      OR: [
        { candidateId: user.userId },
        { email: user.email },
      ],
    },
    include: {
      test: {
        select: {
          title: true,
          timeLimitMins: true,
          tokenBudget: true,
          description: true,
        },
      },
      submission: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          tokensUsed: true,
          tokenBudget: true,
          scoreComposite: true,
          scoreCorrectness: true,
          scoreTime: true,
          scoreTokenSaving: true,
          scoreCodeQuality: true,
          timeUsedMins: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ invites })
}, "CANDIDATE")
