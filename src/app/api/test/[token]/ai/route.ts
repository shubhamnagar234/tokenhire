import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { aiRateLimit } from "@/lib/rate-limit";

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

    if (aiRateLimit) {
      const { success } = await aiRateLimit.limit(user.userId);
      if (!success) {
        return NextResponse.json(
          { error: "Too many AI requests. Please slow down." },
          { status: 429 }
        );
      }
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

  // check token budget
  const tokensRemaining = submission.tokenBudget - submission.tokensUsed;
  if (tokensRemaining <= 0) {
    return NextResponse.json(
      { error: "Token budget exhausted — no more AI assistance available" },
      { status: 402 },
    );
  }

  // LangChain + Gemini call
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: Math.min(500, tokensRemaining),
  });

  const systemPrompt = SYSTEM_PROMPTS[promptType] ?? SYSTEM_PROMPTS.HINT;

  const messages = [
    new SystemMessage(
      `You are a coding assistant during a technical assessment. ${systemPrompt}`,
    ),
    new HumanMessage(prompt),
  ];

  const aiResult = await llm.invoke(messages);
  const aiResponse = aiResult.content as string;

  // estimate tokens — Gemini doesn't always return exact count
  // approximate: 1 token ≈ 4 characters
  const estimatedTokens = Math.ceil((prompt.length + aiResponse.length) / 4);
  const tokensToDeduct = Math.min(estimatedTokens, tokensRemaining);

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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, "CANDIDATE");
