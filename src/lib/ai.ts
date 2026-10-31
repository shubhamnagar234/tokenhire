import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { config } from "@/lib/config";

export interface AIExecutionResult {
  content: string;
  tokensUsed: number;
  provider: "gemini" | "groq" | "openrouter";
  model: string;
}

export interface PromptOptions {
  messages: BaseMessage[];
  maxTokens: number;
  userPrompt?: string;
  requestedModel?: string;
}

/**
 * Executes an AI prompt with a resilient multi-tier fallback:
 * 1. Primary: Google Gemini API (gemini-2.5-flash via GEMINI_API_KEY)
 * 2. 1st Fallback: Groq API (qwen/qwen3.8-27b via GROQ_API_KEY)
 * 3. 2nd / Last Fallback: OpenRouter API (google/gemini-2.5-flash via OPENROUTER_API_KEY)
 */
export async function executeWithFallback({
  messages,
  maxTokens,
  userPrompt,
}: PromptOptions): Promise<AIExecutionResult> {
  // ── 1. PRIMARY: Google Gemini API ─────────────────────────────
  if (config.GEMINI_API_KEY) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: config.GEMINI_API_KEY,
        maxOutputTokens: maxTokens,
      });

      const result = await llm.invoke(messages);
      const text = (
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content)
      ).trim();

      if (text.length > 0) {
        const tokens =
          result.usage_metadata?.total_tokens ??
          Math.ceil(((userPrompt?.length ?? 0) + text.length) / 4);

        return {
          content: text,
          tokensUsed: tokens,
          provider: "gemini",
          model: "gemini-2.5-flash",
        };
      }
    } catch (err: unknown) {
      console.warn(
        "[AI Orchestrator] Primary provider (Google Gemini) failed, trying Groq fallback:",
        (err as Error).message,
      );
    }
  }

  // ── 2. 1ST FALLBACK: Groq API ─────────────────────────────────
  if (config.GROQ_API_KEY) {
    try {
      const llm = new ChatOpenAI({
        modelName: "qwen/qwen3.8-27b",
        apiKey: config.GROQ_API_KEY,
        configuration: {
          baseURL: "https://api.groq.com/openai/v1",
        },
        maxTokens: maxTokens,
      });

      const result = await llm.invoke(messages);
      const text = (
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content)
      ).trim();

      if (text.length > 0) {
        const tokens =
          result.usage_metadata?.total_tokens ??
          Math.ceil(((userPrompt?.length ?? 0) + text.length) / 4);

        return {
          content: text,
          tokensUsed: tokens,
          provider: "groq",
          model: "qwen/qwen3.8-27b",
        };
      }
    } catch (err: unknown) {
      console.warn(
        "[AI Orchestrator] 1st Fallback provider (Groq) failed, trying OpenRouter fallback:",
        (err as Error).message,
      );
    }
  }

  // ── 3. 2ND / LAST FALLBACK: OpenRouter API ────────────────────
  if (config.OPENROUTER_API_KEY) {
    try {
      const llm = new ChatOpenAI({
        modelName: "google/gemini-2.5-flash",
        apiKey: config.OPENROUTER_API_KEY,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
        maxTokens: maxTokens,
      });

      const result = await llm.invoke(messages);
      const text = (
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content)
      ).trim();

      if (text.length > 0) {
        const tokens =
          result.usage_metadata?.total_tokens ??
          Math.ceil(((userPrompt?.length ?? 0) + text.length) / 4);

        return {
          content: text,
          tokensUsed: tokens,
          provider: "openrouter",
          model: "google/gemini-2.5-flash",
        };
      }
    } catch (err: unknown) {
      console.error(
        "[AI Orchestrator] 2nd Fallback provider (OpenRouter) failed:",
        (err as Error).message,
      );
    }
  }

  throw new Error(
    "All AI providers (Gemini primary, Groq 1st fallback, OpenRouter last fallback) are currently unavailable. Please verify API keys or try again shortly.",
  );
}

/**
 * Ask the multi-tier AI orchestrator to rate candidate code quality 0–100.
 * Falls back through Gemini -> Groq -> OpenRouter -> returns undefined
 * so scoring.ts can use its deterministic mathematical fallback formula.
 */
export async function getAICodeQualityScore(
  answers: { code: string; language: string }[],
): Promise<number | undefined> {
  if (answers.length === 0) return undefined;

  const codeBlock = answers
    .map(
      (a, i) =>
        `### Solution ${i + 1} (${a.language})\n\`\`\`\n${a.code.slice(0, 1500)}\n\`\`\``,
    )
    .join("\n\n");

  const messages = [
    new SystemMessage(
      "You are a senior software engineer reviewing candidate code quality. " +
        "Evaluate readability, naming conventions, edge-case handling, and idiomatic style. " +
        'Respond with ONLY a valid JSON object in this exact format: { "score": <integer 0-100> }. ' +
        "No explanation, no markdown, no extra text.",
    ),
    new HumanMessage(
      `Rate the overall code quality of the following candidate solutions:\n\n${codeBlock}`,
    ),
  ];

  try {
    const res = await executeWithFallback({
      messages,
      maxTokens: 256,
      userPrompt: codeBlock,
    });

    const cleaned = res.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.score === "number" &&
      parsed.score >= 0 &&
      parsed.score <= 100
    ) {
      return Math.round(parsed.score);
    }
  } catch (err: unknown) {
    console.warn(
      "[AI Orchestrator] Code quality evaluation failed across providers, defaulting to proxy formula:",
      (err as Error).message,
    );
  }

  return undefined;
}
