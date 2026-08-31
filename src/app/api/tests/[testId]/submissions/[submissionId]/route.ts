import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";

export const GET = withAuth(async (req, user, context) => {
  const { testId, submissionId } = await context.params;

  // Verify recruiter owns the test that this submission belongs to
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      invite: {
        testId,
        test: { company: { users: { some: { id: user.userId } } } },
      },
    },
    include: {
      candidate: { select: { name: true, email: true } },
      invite: {
        include: {
          test: {
            select: {
              title: true,
              timeLimitMins: true,
              tokenBudget: true,
              weightCorrectness: true,
              weightTime: true,
              weightTokenSaving: true,
              weightCodeQuality: true,
            },
          },
        },
      },
      answers: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              description: true,
            },
          },
        },
        orderBy: { submittedAt: "asc" },
      },
      tokenLogs: {
        select: {
          promptType: true,
          tokensUsed: true,
          prompt: true,
          response: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found or access denied" },
      { status: 403 },
    );
  }

  // Build per-problem breakdown
  const problemBreakdown = submission.answers.map(
    (answer: {
      problem: {
        id: string;
        title: string;
        difficulty: string;
        description: string;
      };
      language: string;
      code: string;
      testCasesPassed: number;
      testCasesTotal: number;
      submittedAt: Date;
    }) => ({
      problemId: answer.problem.id,
      problemTitle: answer.problem.title,
      difficulty: answer.problem.difficulty,
      description: answer.problem.description,
      language: answer.language,
      code: answer.code,
      testCasesPassed: answer.testCasesPassed,
      testCasesTotal: answer.testCasesTotal,
      passRate:
        answer.testCasesTotal > 0
          ? Math.round((answer.testCasesPassed / answer.testCasesTotal) * 100)
          : 0,
      submittedAt: answer.submittedAt,
    }),
  );

  // AI usage breakdown per prompt type
  const aiUsage = submission.tokenLogs.reduce(
    (
      acc: Record<string, number>,
      log: { promptType: string; tokensUsed: number },
    ) => {
      acc[log.promptType] = (acc[log.promptType] ?? 0) + log.tokensUsed;
      return acc;
    },
    {} as Record<string, number>,
  );

  return NextResponse.json({
    submission: {
      id: submission.id,
      status: submission.status,
      startedAt: submission.startedAt,
      submittedAt: submission.submittedAt,
      timeUsedMins: submission.timeUsedMins,
      tokensUsed: submission.tokensUsed,
      tokenBudget: submission.tokenBudget,
      scores: {
        correctness: submission.scoreCorrectness,
        time: submission.scoreTime,
        tokenSaving: submission.scoreTokenSaving,
        codeQuality: submission.scoreCodeQuality,
        composite: submission.scoreComposite,
      },
      candidate: submission.candidate,
      test: submission.invite.test,
      problemBreakdown,
      aiUsage,
      aiLogs: submission.tokenLogs,
    },
  });
}, "RECRUITER");
