// Optional station state cache.
// If Redis client isn't available, falls back to in-memory.

const inMemory = new Map(); // key -> { value, expiresAt }

const getCached = async (key) => {
  const entry = inMemory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    inMemory.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = async (key, value, ttlMs) => {
  const expiresAt = ttlMs ? Date.now() + ttlMs : null;
  inMemory.set(key, { value, expiresAt });
};

let redisCache = null;
try {
  // Prefer ioredis if present; otherwise 'redis' package.
  // This is optional; failure will keep in-memory mode.
  // eslint-disable-next-line global-require
  const RedisCtor = require("ioredis");
  redisCache = new RedisCtor(process.env.REDIS_URL);
} catch (_e) {
  try {
    const Redis = require("redis");
    // Basic wrapper for redis v4 createClient
    const client = Redis.createClient({ url: process.env.REDIS_URL });
    // Connect is async; we won't block startup. If it fails, in-memory is still used.
    client.connect().catch(() => {});
    redisCache = client;
  } catch (_e2) {
    redisCache = null;
  }
}

const redisGet = async (key) => {
  if (!redisCache) return null;
  // ioredis: get returns string; node-redis v4: get returns string
  const v = await redisCache.get(key);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const redisSet = async (key, value, ttlMs) => {
  if (!redisCache) return;
  const payload = JSON.stringify(value);
  if (ttlMs) {
    // ioredis set(key, val, 'PX', ttl)
    if (typeof redisCache.set === "function" && redisCache.set.length >= 3) {
      await redisCache.set(key, payload, "PX", ttlMs);
      return;
    }
  }
  await redisCache.set(key, payload);
};

const getStationStateCache = async (key) => {
  if (redisCache) return redisGet(key);
  return getCached(key);
};

const setStationStateCache = async (key, value, ttlMs) => {
  if (redisCache) return redisSet(key, value, ttlMs);
  return setCached(key, value, ttlMs);
};

module.exports = {
  getStationStateCache,
  setStationStateCache,
};

