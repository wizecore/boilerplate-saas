import logger from "@/lib/logger";
import { createHash } from "@/lib/network";
import { okstatus } from "@/lib/utils";
import Redis, { Redis as RedisClient } from "ioredis";

interface CacheHolder {
  __redis?: RedisClient | null;
}

const cache = process.env.AWS_EXECUTION_ENV
  ? ({} as CacheHolder)
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (((globalThis as any).jest ? globalThis : Redis) as unknown as CacheHolder);

export const getRedis = () => {
  if (!cache.__redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      return undefined;
    }

    const redis = new Redis(
      process.env.REDIS_TOKEN ? url.replace("$REDIS_TOKEN", process.env.REDIS_TOKEN) : url,
      {
        enableOfflineQueue: true,
        commandTimeout: 3000,
        lazyConnect: true
      }
    );

    logger.info("Connecting to Redis", process.env.REDIS_URL);
    redis.connect();
    cache.__redis = redis;
  }

  return cache.__redis || undefined;
};

export const closeRedis = () => {
  if (cache.__redis) {
    logger.info("Disconnecting from Redis", process.env.REDIS_URL);
    cache.__redis.disconnect();
    cache.__redis = undefined;
  }
};

const CacheUtil = {
  prefix: process.env.CACHE_PREFIX || "",
  timeoutMs: 3 * 3600 * 1000, // 3 hours
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replacer: (key: string, value: any) => {
    if (
      (key.endsWith("Date") || key.endsWith("_at") || key.endsWith("At")) &&
      typeof value != "string"
    ) {
      return value.toISOString();
    }
    return value;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviver: (key: string, value: any) => {
    if ((key.endsWith("Date") || key.endsWith("_at") || key.endsWith("At")) && value) {
      return new Date(value);
    }
    return value;
  },
  unjson: (str: string) => {
    return JSON.parse(str, CacheUtil.reviver);
  },
  json: (data: SettableValue): string => {
    return JSON.stringify(data, CacheUtil.replacer);
  }
};

type SettableValue = NonNullable<unknown>;
type Value = SettableValue | null;

export interface ICache {
  redis?: RedisClient;
  /**
   * Returns value if found, or null if not found
   */
  get: <T extends Value>(key: string) => Promise<T | null>;

  /**
   * Returns cached, or updates cache with new value by specifed def() creator function
   */
  getset: <T extends Value>(
    key: string,
    def: () => Promise<T>,
    timeoutMs?: number
  ) => Promise<T | null>;

  /** Sets value, if data is null, removes value */
  set: <T extends Value>(key: string, data: T, timeoutMs?: number) => Promise<boolean>;
}

const createRedisCache = (redis: RedisClient): ICache => ({
  redis: getRedis(),
  get: async <T extends Value>(key: string): Promise<T | null> => {
    const reply = await redis.get(CacheUtil.prefix + key);
    if (reply != null) {
      const data = CacheUtil.unjson(reply);
      if (logger.isVerbose) {
        logger.verbose("Returning cached", key);
      }
      return data;
    } else {
      if (logger.isVerbose) {
        logger.verbose("Cache not found", key);
      }
      return null;
    }
  },
  getset: async <T extends Value>(
    key: string,
    def: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T | null> => {
    const reply = await redis.get(CacheUtil.prefix + key);
    if (reply === null) {
      if (logger.isVerbose) {
        logger.verbose("Cache not found", key);
      }
      const value = await def();
      if (value !== null && value !== undefined) {
        await redis.set(
          CacheUtil.prefix + key,
          CacheUtil.json(value),
          "PX",
          timeoutMs ? timeoutMs : CacheUtil.timeoutMs
        );
      } else {
        await redis.del(CacheUtil.prefix + key);
      }
      return value;
    } else {
      const data = CacheUtil.unjson(reply);
      if (logger.isVerbose) {
        logger.verbose("Returning cached", key);
      }
      return data;
    }
  },
  set: async <T extends Value>(key: string, data: T, timeoutMs?: number): Promise<boolean> => {
    if (data === null || data === undefined) {
      if (logger.isVerbose) {
        logger.verbose("Removing cached value for " + data, key);
      }
      const reply = await redis.del(key);
      return reply > 0;
    }

    if (logger.isVerbose) {
      logger.verbose("Caching", key);
    }
    if (data !== null && data !== undefined) {
      const reply = await redis.set(
        CacheUtil.prefix + key,
        CacheUtil.json(data),
        "PX",
        timeoutMs ? timeoutMs : CacheUtil.timeoutMs
      );
      return reply === "OK";
    } else {
      const reply = await redis.del(CacheUtil.prefix + key);
      return reply > 0;
    }
  }
});

export const createNoneCache = (): ICache => ({
  get: <T extends Value>(_key: string): Promise<T | null> => Promise.resolve(null),
  getset: <T extends Value>(_key: string, def: () => Promise<T>) => Promise.resolve(def()),
  set: <T extends Value>(_key: string, _data: T) => Promise.resolve(false)
});

export const getCache = (): ICache =>
  getRedis() ? createRedisCache(getRedis()!) : createNoneCache();

// Implementation of fetch with caching
export const fetchCached = async <T>(
  input: string,
  init: (RequestInit & { cacheMs?: number }) | undefined,
  parse: (response: Response) => Promise<T>
): Promise<T> => {
  if (init?.cacheMs !== 0) {
    const cached = await getCache().get("fetch-" + createHash(input));
    if (cached) {
      return cached as T;
    }
  }

  logger.info("Fetching", input);
  const response = await fetch(input, init).then(okstatus);
  const value = await parse(response);

  // Update cache anyway, even if we skip caching
  if (value !== null && value !== undefined) {
    await getCache().set(
      "fetch-" + createHash(input),
      value,
      init?.cacheMs ?? CacheUtil.timeoutMs
    );
  }

  return value;
};
