import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { executeWithFallback } from "@/lib/ai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { aiRateLimit, checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  prompt: z.string().min(1),
  promptType: z.enum(["HINT", "EXPLAIN", "DEBUG", "OPTIMIZE", "GENERATE"]),
  problemId: z.string(),
  submissionId: z.string(),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  HINT: "Give a directional hint only. Do not provide complete solutions. One sentence max.",
  EXPLAIN: "Explain the concept or problem clearly. Be concise.",
  DEBUG:
    "Help identify the bug without fixing it. Point to the area of concern.",
  OPTIMIZE:
    "Suggest an optimization approach without writing the full solution.",
  GENERATE: "You may provide more complete code guidance for this request.",
};

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const { prompt, promptType, problemId, submissionId } = schema.parse(body);

    const { success } = await checkRateLimit(aiRateLimit, user.userId);
    if (!success) {
      return NextResponse.json(
        { error: "Too many AI requests. Please slow down." },
        { status: 429 },
      );
    }

    // get current submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { invite: { include: { test: true } } },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.candidateId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // verify problem belongs to this test
    const testProblem = await prisma.testProblem.findUnique({
      where: {
        testId_problemId: {
          testId: submission.invite.testId,
          problemId,
        },
      },
    });

    if (!testProblem) {
      return NextResponse.json(
        { error: "Problem not found or not part of this test" },
        { status: 404 },
      );
    }

    // check token budget
    const tokensRemaining = submission.tokenBudget - submission.tokensUsed;
    if (tokensRemaining <= 0) {
      return NextResponse.json(
        { error: "Token budget exhausted — no more AI assistance available" },
        { status: 402 },
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[promptType] ?? SYSTEM_PROMPTS.HINT;
    const messages = [
      new SystemMessage(
        `You are a coding assistant during a technical assessment. ${systemPrompt}`,
      ),
      new HumanMessage(prompt),
    ];

    // Multi-tier execution: Primary (Gemini) -> 1st Fallback (Groq) -> 2nd Fallback (OpenRouter)
    const aiResult = await executeWithFallback({
      messages,
      maxTokens: Math.min(500, tokensRemaining),
      userPrompt: prompt,
    });

    const aiResponse = aiResult.content;
    const tokensToDeduct = Math.min(aiResult.tokensUsed, tokensRemaining);

    // deduct tokens + log atomically
    await prisma.$transaction([
      prisma.submission.update({
        where: { id: submissionId },
        data: { tokensUsed: { increment: tokensToDeduct } },
      }),
      prisma.tokenLog.create({
        data: {
          candidateId: user.userId,
          submissionId,
          problemId,
          tokensUsed: tokensToDeduct,
          promptType,
          prompt,
          response: aiResponse,
        },
      }),
    ]);

    const newTokensUsed = submission.tokensUsed + tokensToDeduct;

    return NextResponse.json({
      response: aiResponse,
      tokensUsed: tokensToDeduct,
      tokensRemaining: submission.tokenBudget - newTokensUsed,
      totalTokensUsed: newTokensUsed,
      tokenBudget: submission.tokenBudget,
      provider: aiResult.provider,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 });
    }
    console.error("[AI Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}, "CANDIDATE");
