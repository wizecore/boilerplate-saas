import { getRedis } from "@/lib/cache";
import { Redis as RedisClient } from "ioredis";
import logger from "./logger";
import { getRandomInt, niceid } from "./utils";

const delifequal = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0`;

// PEXPIRE key milliseconds [NX | XX | GT | LT]
const pexpireifequal = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0`;

interface LockConfig {
  clientId?: string;
  /** Lock timeout */
  timeout: number;
  /** Combined with delay, produces the total time we wait to acquire lock */
  maxRetries: number;
  delay: number;
  jitter: number;
}

class LockAcquisitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockAcquisitionError";
  }
}

class LockReleaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockReleaseError";
  }
}

class LockExtendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockExtendError";
  }
}
declare module "ioredis" {
  interface Commands {
    delifequal(key: string, id: string): Promise<number>;
    pexpireifequal(key: string, id: string, ms: number): Promise<number>;
  }
}

/**
 * Lock class from https://github.com/microfleet/ioredis-lock
 */
export class Lock {
  static _acquiredLocks: Set<Lock> = new Set();

  private readonly _id: string = niceid();
  private readonly _client: ReturnType<typeof Lock._setupClient>;
  private _locked = false;
  private _key: string | null = null;

  public readonly config: LockConfig = {
    maxRetries: 300,
    delay: 50,
    jitter: 1.2,
    timeout: 30000
  };

  /**
   * The constructor for a Lock object. Accepts both a redis client, as well as
   * an options object with the following properties: timeout, retries and delay.
   * Any options not supplied are subject to the current defaults.
   * @constructor
   *
   * @param {RedisClient} client  The node_redis client to use
   * @param {object}      options
   *
   * @property {int} timeout Time in milliseconds before which a lock expires
   * @property {int} retries Maximum number of retries in acquiring a lock if the
   *                         first attempt failed
   * @property {int} delay   Time in milliseconds to wait between each attempt
   */
  constructor(client: RedisClient, options?: Partial<LockConfig>) {
    this._client = Lock._setupClient(client);

    Object.defineProperty(this, "_client", { enumerable: false });

    if (options && typeof options === "object") {
      Object.assign(this.config, options);
    }

    if (this.config.jitter < 1) {
      logger.warn("Lock: Jitter must be above or equal to 1");
      this.config.jitter = 1;
    }
  }

  /**
   * Attempts to acquire a lock, given a key, and an optional callback function.
   * If the initial lock fails, additional attempts will be made for the
   * configured number of retries, and padded by the delay. The callback is
   * invoked with an error on failure, and returns a promise if no callback is
   * supplied. If invoked in the context of a promise, it may throw a
   * LockAcquisitionError.
   *
   * @param key The redis key to use for the lock
   */
  async acquire(key: string): Promise<Lock> {
    if (this._locked) {
      throw new LockAcquisitionError("Lock already held");
    }

    if (this.config.delay < 10) {
      throw new LockAcquisitionError("Delay must be at least 10ms: " + this.config.delay);
    }

    if (this.config.jitter < 1) {
      throw new LockAcquisitionError("Jitter must be at least 1: " + this.config.jitter);
    }

    try {
      logger.info("Acquiring lock", key, this.config.maxRetries, this.config.delay);
      await this._attemptLock(key, this.config.maxRetries, Date.now());
      this._locked = true;
      this._key = key;
      Lock._acquiredLocks.add(this);
    } catch (err) {
      if (!(err instanceof LockAcquisitionError)) {
        logger.warn("_attemptLock failed", err, "key", this._key);
        throw new LockAcquisitionError((err as Error).message + ", key " + this._key);
      }

      throw err;
    }

    return this;
  }

  /**
   * Attempts to extend the lock
   * @param expire in `timeout` seconds
   */
  async extend(timeout: number = this.config.timeout): Promise<Lock> {
    const key = this._key;
    const client = this._client;

    if (!this._locked || !key) {
      throw new LockExtendError("Lock has not been acquired");
    }

    try {
      const res = await client.pexpireifequal(key, this._id, timeout);
      if (res) {
        return this;
      }

      this._locked = false;
      this._key = null;
      Lock._acquiredLocks.delete(this);
      throw new LockExtendError(`Lock on "${key}" had expired`);
    } catch (err) {
      if (!(err instanceof LockExtendError)) {
        throw new LockExtendError((err as Error).message);
      }

      throw err;
    }
  }

  /**
   * Attempts to release the lock, and accepts an optional callback function.
   * The callback is invoked with an error on failure, and returns a promise
   * if no callback is supplied. If invoked in the context of a promise, it may
   * throw a LockReleaseError.
   */
  async release(): Promise<Lock> {
    const key = this._key;
    const client = this._client;

    if (!this._locked || !key) {
      throw new LockReleaseError("Lock has not been acquired");
    }

    try {
      const res = await client.delifequal(key, this._id);

      this._locked = false;
      this._key = null;
      Lock._acquiredLocks.delete(this);

      if (!res) {
        throw new LockReleaseError(`Lock on "${key}" had expired`);
      }
    } catch (err) {
      // Wrap redis errors
      if (!(err instanceof LockReleaseError)) {
        throw new LockReleaseError((err as Error).message + ", key " + key);
      }

      throw err;
    }

    return this;
  }

  /**
   * @private
   */
  private static _setupClient(client: RedisClient) {
    const cc = client as RedisClient & {
      delifequal: (key: string, id: string) => Promise<number>;
      pexpireifequal: (key: string, id: string, ms: number) => Promise<number>;
    };

    if (!cc.delifequal) {
      cc.defineCommand("delifequal", {
        lua: delifequal,
        numberOfKeys: 1
      });
    }

    if (!cc.pexpireifequal) {
      cc.defineCommand("pexpireifequal", {
        lua: pexpireifequal,
        numberOfKeys: 1
      });
    }

    return cc;
  }

  /**
   * Attempts to acquire the lock, and retries upon failure if the number of
   * remaining retries is greater than zero. Each attempt is padded by the
   * lock's configured retry delay.
   *
   * @param {string} key     The redis key to use for the lock
   * @param {int}    retries Number of remaining retries
   *
   * @returns {Promise}
   */
  async _attemptLock(key: string, retries: number, started: number): Promise<void> {
    // logger.verbose("Attempt lock", key, "retries left", retries, "elapsed", Date.now() - started);
    const client = this._client;
    const timeout = this.config.timeout;
    // SET key value NX PX milliseconds
    const start = Date.now();
    const res = await client.set(key, this._id, "PX", timeout, "NX");

    if (!res && Date.now() - started > timeout) {
      throw new LockAcquisitionError(
        `Could not acquire lock on "${key}", timed out, elapsed ${
          Date.now() - started
        }ms, clientId "${this.config.clientId}" timeout ${timeout}`
      );
    } else if (!res && retries < 1) {
      throw new LockAcquisitionError(
        `Could not acquire lock on "${key}", no more tries, elapsed ${
          Date.now() - started
        }ms, clientId "${this.config.clientId}" tried ${this.config.maxRetries} times`
      );
    } else if (res) {
      return;
    }

    /* Only wait if we have a delay more than we spent waiting already */
    const elapsed = Date.now() - start;
    const delay = this.config.delay * getRandomInt(1, this.config.jitter);
    if (elapsed < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - elapsed));
    }
    return this._attemptLock(key, retries - 1, started);
  }
}

/**
 * Returns a new Lock instance, configured for use with the supplied redis
 * client, as well as options, if provided.
 *
 * Based on https://github.com/microfleet/ioredis-lock
 *
 * <code>
 * const lock = createLock()
 * lock.acquire("test-api")
 * try {
 *  // Do something
 * } finally {
 *  lock.release()
 * }
 * </code>
 */
export const createLock = (config?: Partial<LockConfig>) => {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis not available");
  }

  return new Lock(redis, {
    clientId: "lock_" + niceid(),
    timeout: 60000,
    /** maxRetries*delay should match timeout or else parallel process will expire much earlier */
    maxRetries: 1200,
    delay: 50,
    ...config,
    // Calculate maxRetries based on timeout and delay
    ...(config?.timeout && !config?.maxRetries
      ? {
          maxRetries: Math.ceil(config.timeout / (config.delay ?? 50))
        }
      : {})
  });
};

/**
 * Returns an array of currently active/acquired locks in the current process.
 */
export function getAcquiredLocks(): Lock[] {
  return Array.from(Lock._acquiredLocks);
}
