import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import { config } from "./config"

// Create a mock redis client if env vars are missing so the build doesn't fail
// but it will throw if actually used without vars.
export const redis = (config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// AI requests: 5 per minute per user
export const aiRateLimit = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/ai",
    })
  : null

// Submit requests: 10 per minute per user
export const submitRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/submit",
    })
  : null

/**
 * Resilient rate-limit check with fail-open behavior.
 * If Redis is unreachable or has DNS failure, logs warning and allows request through
 * so caching outages do not block active candidate assessments.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean }> {
  if (!limiter) return { success: true };
  try {
    const res = await limiter.limit(identifier);
    return { success: res.success };
  } catch (err: unknown) {
    console.warn(
      "[RateLimit Warning] Redis unreachable, failing open:",
      (err as Error).message,
    );
    return { success: true };
  }
}

