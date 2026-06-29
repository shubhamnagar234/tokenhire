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
