import rateLimit, { MemoryStore } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient, isRedisAvailable } from "../cache/redisClient";

/**
 * Creates a rate limiter with a Redis-backed store when Redis is connected,
 * seamlessly falling back to express-rate-limit's in-memory MemoryStore if
 * Redis is not configured or temporarily unreachable.
 */
function createLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  prefix: string;
}) {
  const localStore = new MemoryStore();
  const redis = getRedisClient();

  const redisStore = (redis && isRedisAvailable())
    ? new RedisStore({
        sendCommand: async (...args: string[]) => {
          return (redis as any).call(...args);
        },
        prefix: `rl:${options.prefix}:`
      })
    : null;

  const dualStore = {
    async init(optionsArg: any) {
      localStore.init(optionsArg);
      if (isRedisAvailable() && redisStore && typeof (redisStore as any).init === "function") {
        try {
          await (redisStore as any).init(optionsArg);
        } catch {}
      }
    },

    async get(key: string) {
      if (isRedisAvailable() && redisStore && typeof (redisStore as any).get === "function") {
        try {
          return await (redisStore as any).get(key);
        } catch (err) {}
      }
      return await localStore.get(key);
    },

    async increment(key: string) {
      if (isRedisAvailable() && redisStore) {
        try {
          return await redisStore.increment(key);
        } catch (err) {}
      }
      return await localStore.increment(key);
    },

    async decrement(key: string) {
      if (isRedisAvailable() && redisStore) {
        try {
          return await redisStore.decrement(key);
        } catch (err) {}
      }
      return await localStore.decrement(key);
    },

    async resetKey(key: string) {
      if (isRedisAvailable() && redisStore) {
        try {
          await redisStore.resetKey(key);
        } catch (err) {}
      }
      await localStore.resetKey(key);
    }
  };

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: false },
    store: dualStore as any,
    message: {
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000)
    }
  });
}

/**
 * AI & Chat Route Rate Limiter
 * Applied to slow/costly LLM endpoints (chat.ts, copilot.ts)
 * Limits requests to 20 per minute per IP.
 */
export const aiRateLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // 20 requests per minute
  message: "AI request rate limit exceeded. Please wait a moment before sending another message.",
  prefix: "ai"
});

/**
 * General API Rate Limiter
 * Applied across all public API routes to prevent flood/DDoS
 * Limits requests to 120 per minute per IP.
 */
export const globalApiRateLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: "Too many requests to the market platform. Please slow down.",
  prefix: "api"
});
