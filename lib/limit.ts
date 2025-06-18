import { getRedis } from "@/lib/cache";
import { Redis as RedisClient } from "ioredis";

type TimestampProducer = (time: Date) => string;

/**
 * Information about limit
 */
export interface LimitResult {
  /** Maximum for this limit */
  max: number;
  /** Redis key */
  key: string;
  /** Current limit (might be little bit higher than max) */
  current: number;
  /** Is current action limited? Key not added, etc. */
  limit: boolean;
  /** Maximum available reservation, after last call */
  available: number;
  /** Granted by current call */
  granted: number;
}

/**
 * Unique limit result
 */
export interface LimitUniqueKeyResult extends LimitResult {
  /**
   * All allocated keys in the limit (ip addresses)
   */
  values?: string[];
}

const limitValue = async (
  redis: RedisClient,
  prefix: string,
  increment: number,
  max: number,
  expiration: number,
  ts: TimestampProducer
): Promise<LimitResult> => {
  const now = new Date();
  const timestamp = ts(now);
  const key = prefix + timestamp;
  const previous = await redis.incrby(key, 0);

  if (increment === 0) {
    return {
      key,
      max,
      current: previous,
      limit: false,
      available: Math.max(0, max - previous),
      granted: 0
    };
  } else if (previous > max) {
    return { key, max, current: previous, limit: true, available: 0, granted: 0 };
  } else {
    // https://redis.io/commands/incr
    const replies = await redis
      .multi()
      .incrby(key, previous + increment > max ? max - previous : increment)
      .expire(key, expiration) // FIXME: should it expire from the start of period defined (i.e. hour)?
      .exec();

    if (!replies) {
      throw new Error("Failed to increment limit");
    }

    const value = replies[0][1] as number;

    return {
      key,
      max,
      current: value,
      limit: value >= max,
      granted: value - previous,
      available: Math.max(0, max - value)
    };
  }
};

const limitUnique = async (
  redis: RedisClient,
  prefix: string,
  max: number,
  expiration: number,
  ts: TimestampProducer,
  key?: string,
  fetchValues?: boolean
): Promise<LimitUniqueKeyResult> => {
  const redisKey = prefix + ts(new Date());

  if (key === undefined) {
    const values = fetchValues ? await redis.hkeys(redisKey) : undefined;
    const current = await redis.hlen(redisKey);
    return {
      current,
      max,
      key: redisKey,
      limit: false,
      available: Math.max(0, max - current),
      granted: 0,
      values
    };
  }

  const result = (await redis.eval(
    `local current
current = redis.call('HLEN', KEYS[1])
if current >= tonumber(ARGV[2]) then
  return -current
else
  if redis.call('EXISTS', KEYS[1]) == 0 then
    redis.call('HSET', KEYS[1], ARGV[1], ARGV[4])
    redis.call('EXPIRE', KEYS[1], ARGV[3])
  else
    redis.call('HSETNX', KEYS[1], ARGV[1], ARGV[4])
  end
end
return redis.call('HLEN', KEYS[1])`,
    1,
    redisKey, // KEYS[1]

    key, // ARGV[1] ip address or other key
    String(max), // ARGV[2] Max
    String(expiration), // ARGV[3] Expiration
    String(Date.now()) // ARGV[4] Value for key (last set)
  )) as number;

  const values = fetchValues ? await redis.hkeys(redisKey) : undefined;

  if (result < 0) {
    // Negative returned when hit the limit and have not been added
    return {
      current: -result,
      max,
      key: redisKey,
      limit: true,
      available: Math.max(0, max + result),
      granted: 0,
      values
    };
  } else {
    return {
      current: result,
      max,
      key: redisKey,
      limit: false,
      available: Math.max(0, max - result),
      granted: 1,
      values
    };
  }
};

const timestampDay = (now: Date) =>
  new Date(
    now.getTime() -
      now.getUTCMilliseconds() -
      now.getUTCSeconds() * 1000 -
      now.getUTCMinutes() * 60 * 1000 -
      now.getUTCHours() * 3600 * 1000
  ).toISOString();

const timestampHour = (now: Date) =>
  new Date(
    now.getTime() -
      now.getUTCMilliseconds() -
      now.getUTCSeconds() * 1000 -
      now.getUTCMinutes() * 60 * 1000
  ).toISOString();

const timestampMinute = (now: Date) =>
  new Date(
    now.getTime() - now.getUTCMilliseconds() - now.getUTCSeconds() * 1000
  ).toISOString();

const timestampSecond = (now: Date) =>
  new Date(now.getTime() - now.getUTCMilliseconds()).toISOString();

/**
 * Various limit algorithms, will not work without Redis.
 * To make an instance which can work without redis, use OptionalLimit....()
 */
export const Limit = {
  available: () => !!getRedis(),

  /**
   * Returns a function which, upon each invocation will increment limit
   * and return limit information. All timestamps are based on UTC time.
   *
   * const limit = Limit.day("user-id-emails", 100)
   * limit(0).current // current limit
   * limit(100).available // reserve up to 100, return how much available
   **/
  day(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (increment = 1) =>
      limitValue(redis, prefix, increment, max, 3600 * 24, timestampDay);
  },

  hour(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (increment = 1) => limitValue(redis, prefix, increment, max, 3600, timestampHour);
  },

  second(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (increment = 1) => limitValue(redis, prefix, increment, max, 1, timestampSecond);
  },

  minute(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (increment = 1) => limitValue(redis, prefix, increment, max, 60, timestampMinute);
  },

  /**
   * Returns a function, which upon execution, places specified key in unique list,
   * which expires in specified period (day, hour). All timestamps are based on UTC time.
   *
   * const limit = Limit.day("lastusers", 100)
   * limit().current // How much users now
   * limit("testuser1").available // Adds testuser1 and returns how much available
   * limit(undefined, true).keys // returns all values
   */
  dayUnique(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (key?: string, fetchKeys?: boolean) =>
      limitUnique(redis, prefix, max, 3600 * 24, timestampDay, key, fetchKeys);
  },

  hourUnique(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (key?: string, fetchKeys?: boolean) =>
      limitUnique(redis, prefix, max, 3600, timestampHour, key, fetchKeys);
  },

  minuteUnique(prefix: string, max: number) {
    const redis = getRedis();
    if (!redis) {
      throw new Error("No Redis cache");
    }

    return (key?: string, fetchKeys?: boolean) =>
      limitUnique(redis, prefix, max, 60, timestampMinute, key, fetchKeys);
  }
};

/** If no redis available, make it without limit 😱 */
export const OptionalLimit: typeof Limit = {
  available: () => !!getRedis(),
  day: (key, max) =>
    getRedis()
      ? Limit.day(key, max)
      : granted =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: granted || 0
          }),
  hour: (key, max) =>
    getRedis()
      ? Limit.hour(key, max)
      : granted =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: granted || 0
          }),
  second: (key, max) =>
    getRedis()
      ? Limit.second(key, max)
      : granted =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: granted || 0
          }),
  minute: (key, max) =>
    getRedis()
      ? Limit.minute(key, max)
      : granted =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: granted || 0
          }),
  dayUnique: (key, max) =>
    getRedis()
      ? Limit.dayUnique(key, max)
      : (key, fetch) =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: key ? 1 : 0,
            values: fetch && key ? [key] : fetch ? [] : undefined
          }),
  hourUnique: (key, max) =>
    getRedis()
      ? Limit.hourUnique(key, max)
      : (key, fetch) =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: key ? 1 : 0,
            values: fetch && key ? [key] : fetch ? [] : undefined
          }),
  minuteUnique: (key, max) =>
    getRedis()
      ? Limit.hourUnique(key, max)
      : (key, fetch) =>
          Promise.resolve({
            max,
            key: "stub",
            current: 0,
            limit: false,
            available: max,
            granted: key ? 1 : 0,
            values: fetch && key ? [key] : fetch ? [] : undefined
          })
};
