import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";

export const GET = withAuth(async (req, user, context) => {
  const { token: inviteToken } = await context.params;

  try {
    const invite = await prisma.testInvite.findUnique({
      where: { token: inviteToken },
      include: {
        submission: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (!invite.submission || invite.submission.candidateId !== user.userId) {
      return NextResponse.json(
        { error: "Submission not found or access denied" },
        { status: 403 },
      );
    }

    if (invite.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Test not completed yet" },
        { status: 400 },
      );
    }

    const submission = invite.submission;

    return NextResponse.json({
      scores: {
        correctness: submission.scoreCorrectness,
        time: submission.scoreTime,
        tokenSaving: submission.scoreTokenSaving,
        codeQuality: submission.scoreCodeQuality,
        composite: submission.scoreComposite,
      },
      summary: {
        timeUsedMins: submission.timeUsedMins,
        tokensUsed: submission.tokensUsed,
        tokenBudget: submission.tokenBudget,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, "CANDIDATE");
