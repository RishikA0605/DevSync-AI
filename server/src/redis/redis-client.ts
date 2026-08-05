import Redis from "ioredis";

const REDIS_URL = process.env.UPSTASH_REDIS_URL;

let pubClient: Redis;
let subClient: Redis;

if (REDIS_URL) {
  pubClient = new Redis(REDIS_URL);
  subClient = pubClient.duplicate();
  console.log("✅ Redis configured via UPSTASH_REDIS_URL");
} else {
  // For local dev without Redis — no pub/sub scaling, single instance only
  console.warn("⚠️  UPSTASH_REDIS_URL not set. Running without Redis adapter (single instance mode).");
  pubClient = new Redis({ lazyConnect: true });
  subClient = pubClient.duplicate();
}

export const isRedisEnabled = !!REDIS_URL;
export { pubClient, subClient };

// Presence tracking helpers (Redis Sets)
export async function addOnlineUser(workspaceId: string, userId: string) {
  if (!REDIS_URL) return;
  await pubClient.sadd(`online:${workspaceId}`, userId);
  await pubClient.expire(`online:${workspaceId}`, 3600);
}

export async function removeOnlineUser(workspaceId: string, userId: string) {
  if (!REDIS_URL) return;
  await pubClient.srem(`online:${workspaceId}`, userId);
}

export async function getOnlineUsers(workspaceId: string): Promise<string[]> {
  if (!REDIS_URL) return [];
  return pubClient.smembers(`online:${workspaceId}`);
}
