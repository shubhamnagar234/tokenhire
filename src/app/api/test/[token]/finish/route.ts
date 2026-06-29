import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { calculateScore } from "@/lib/scoring";
import { z } from "zod";

const schema = z.object({
  submissionId: z.string(),
});

export const POST = withAuth(async (req, user) => {
  try {
    const rawBody = await req.text();
    const parsed = JSON.parse(rawBody);
    const body = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
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
      (sum, a) => sum + a.testCasesPassed,
      0,
    );
    const totalCases = submission.answers.reduce(
      (sum, a) => sum + a.testCasesTotal,
      0,
    );

    const test = submission.invite.test;

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
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}, "CANDIDATE");
