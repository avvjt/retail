import Redis from "ioredis";

let redisClient: Redis | null = null;
let redisAvailable = false;
let redisInitAttempted = false;

export function getRedisClient(): Redis | null {
  if (redisInitAttempted) {
    return redisAvailable ? redisClient : null;
  }
  redisInitAttempted = true;

  const rawUrl = process.env.REDIS_URL?.trim();
  if (!rawUrl) {
    return null;
  }

  // Validate Redis host and URL structure
  try {
    const formattedUrl = rawUrl.startsWith("redis://") || rawUrl.startsWith("rediss://")
      ? rawUrl
      : `redis://${rawUrl}`;

    const parsed = new URL(formattedUrl);
    const host = parsed.hostname;

    // Reject single-label internal private hostnames (e.g. Render internal names like 'red-dajdtr1594qs73bqrdc0')
    // which cannot be resolved via public DNS outside that specific VPC network
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    const hasExternalDomainOrIp = host.includes(".") || isLocalhost;

    if (!hasExternalDomainOrIp) {
      console.log(`ℹ️ [Redis] Internal cluster hostname "${host}" detected without external domain; using high-speed in-memory store.`);
      redisAvailable = false;
      redisClient = null;
      return null;
    }

    const client = new Redis(formattedUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 2) {
          return null; // Stop retrying quickly if unable to connect
        }
        return Math.min(times * 150, 500);
      }
    });

    client.on("connect", () => {
      redisAvailable = true;
      redisClient = client;
      console.log("✅ [Redis] Connected successfully to Redis server");
    });

    client.on("ready", () => {
      redisAvailable = true;
      redisClient = client;
    });

    client.on("error", (err: any) => {
      redisAvailable = false;
      const isUnreachable =
        err?.code === "EAI_AGAIN" ||
        err?.code === "ENOTFOUND" ||
        err?.code === "ECONNREFUSED" ||
        err?.code === "ETIMEDOUT" ||
        err?.code === "EHOSTUNREACH";

      if (isUnreachable) {
        try {
          client.disconnect();
        } catch {}
        if (redisClient === client) {
          redisClient = null;
        }
        console.log(`ℹ️ [Redis] Host is currently unreachable (${err?.code || err?.message}). Using local in-memory store.`);
      }
    });

    client.on("close", () => {
      redisAvailable = false;
    });

    client.on("end", () => {
      redisAvailable = false;
    });

    // Fire non-blocking connection attempt
    client.connect().catch(() => {
      redisAvailable = false;
      try {
        client.disconnect();
      } catch {}
      if (redisClient === client) {
        redisClient = null;
      }
    });

    redisClient = client;
    return redisClient;
  } catch {
    redisAvailable = false;
    redisClient = null;
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable && !!redisClient;
}

