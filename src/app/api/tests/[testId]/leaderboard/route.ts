import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";

interface LeaderboardSubmission {
  id: string;
  scoreComposite: number | null;
  scoreCorrectness: number | null;
  scoreTime: number | null;
  scoreTokenSaving: number | null;
  scoreCodeQuality: number | null;
  timeUsedMins: number | null;
  tokensUsed: number;
  tokenBudget: number;
  tokenLogs: { promptType: string; tokensUsed: number }[];
}

interface LeaderboardInvite {
  email: string;
  candidate: { name: string; email: string } | null;
  submission: LeaderboardSubmission | null;
}

export const GET = withAuth(async (req, user, context) => {
  const { testId } = await context.params;

  // verify recruiter owns this test
  const test = await prisma.test.findFirst({
    where: {
      id: testId,
      company: { users: { some: { id: user.userId } } },
    },
  });

  if (!test) {
    return NextResponse.json(
      { error: "Test not found or access denied" },
      { status: 403 },
    );
  }

  const invites = await prisma.testInvite.findMany({
    where: { testId, status: "COMPLETED" },
    include: {
      candidate: { select: { name: true, email: true } },
      submission: {
        include: {
          tokenLogs: {
            select: { promptType: true, tokensUsed: true },
          },
        },
      },
    },
    orderBy: {
      submission: { scoreComposite: "desc" },
    },
  });

  const leaderboard = invites
    .map((invite: LeaderboardInvite, index: number) => {
      const sub = invite.submission;
      if (!sub) return null;

      // breakdown of AI usage by prompt type
      const aiUsage = sub.tokenLogs.reduce(
        (
          acc: Record<string, number>,
          log: { promptType: string; tokensUsed: number },
        ) => {
          acc[log.promptType] = (acc[log.promptType] ?? 0) + log.tokensUsed;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        rank: index + 1,
        submissionId: sub.id,
        candidate: {
          name: invite.candidate?.name ?? "Unknown Candidate",
          email: invite.candidate?.email ?? invite.email,
        },
        scores: {
          composite: sub.scoreComposite,
          correctness: sub.scoreCorrectness,
          time: sub.scoreTime,
          tokenSaving: sub.scoreTokenSaving,
          codeQuality: sub.scoreCodeQuality,
        },
        summary: {
          timeUsedMins: sub.timeUsedMins,
          tokensUsed: sub.tokensUsed,
          tokenBudget: sub.tokenBudget,
          tokenEfficiency: Math.round(
            ((sub.tokenBudget - sub.tokensUsed) / sub.tokenBudget) * 100,
          ),
          aiUsageBreakdown: aiUsage,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    test: {
      title: test.title,
      aiModel: test.aiModel,
      totalCandidates: leaderboard.length,
    },
    leaderboard,
  });
}, "RECRUITER");
