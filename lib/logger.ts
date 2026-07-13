/* eslint-disable no-console */

export interface MinimalLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export interface Logger extends MinimalLogger {
  isVerbose: boolean;
  verbose: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/** Shows level and the actual timestamp in the console. */
class Level {
  private level: string;

  constructor(level: string) {
    this.level = level;
  }

  toString() {
    return new Date().toISOString() + " " + this.level;
  }

  [Symbol.toPrimitive](hint: string) {
    if (hint === "string") {
      return new Date().toISOString() + " " + this.level;
    }
    return undefined;
  }
}

/** Do not import directly in the hybrid browser/nodejs code. Use as an instance which returns requestId via toString(). */
const requestTracker = (
  globalThis as unknown as {
    __requestTracker: object;
  }
).__requestTracker;

/**
 * Optional server-side log collector installed on `globalThis.__logCollector`.
 * When present, logger methods forward records to the collector instead of writing to console directly.
 */
const logCollector = (
  globalThis as unknown as {
    __logCollector?: {
      push: (log: {
        level: "debug" | "info" | "warn" | "error";
        message: unknown[];
        timestamp?: number;
      }) => void;
    };
  }
).__logCollector;

/**
 * Universal logger based on console. Also supports logger.verbose()
 * and level testing properties, i.e. logger.isVerbose || false
 *
 * Usage:
 * ```
 * import logger from "@/lib/logger"
 * logger.info(...)
 * logger.verbose(...)
 *
 * if (logger.isVerbose) {
 *  logger.verbose(...)
 * }
 * ```
 */
const logger: Logger = logCollector
  ? {
      isVerbose: process.env.NEXT_PUBLIC_LOG_VERBOSE === "1" ? true : false,
      verbose:
        process.env.NEXT_PUBLIC_LOG_VERBOSE === "1"
          ? (...message: unknown[]) =>
              logCollector.push({
                level: "debug",
                message
              })
          : () => {},
      info: (...message: unknown[]) =>
        logCollector.push({
          level: "info",
          message
        }),
      warn: (...message: unknown[]) =>
        logCollector.push({
          level: "warn",
          message
        }),
      error: (...message: unknown[]) =>
        logCollector.push({
          level: "error",
          message
        })
    }
  : {
      isVerbose: process.env.NEXT_PUBLIC_LOG_VERBOSE === "1" ? true : false,
      verbose:
        process.env.NEXT_PUBLIC_LOG_VERBOSE === "1"
          ? requestTracker
            ? console.info.bind(console.info, "%s%s", new Level("DEBUG"), requestTracker)
            : console.info.bind(console.info, "%s", new Level("DEBUG"))
          : () => {},
      info: requestTracker
        ? console.info.bind(console.info, "%s%s", new Level("INFO"), requestTracker)
        : console.info.bind(console.info, "%s", new Level("INFO")),
      warn: requestTracker
        ? console.warn.bind(console.warn, "%s%s", new Level("WARN"), requestTracker)
        : console.warn.bind(console.warn, "%s", new Level("WARN")),
      error: requestTracker
        ? console.error.bind(console.error, "%s%s", new Level("ERROR"), requestTracker)
        : console.error.bind(console.error, "%s", new Level("ERROR"))
    };

export default logger;
