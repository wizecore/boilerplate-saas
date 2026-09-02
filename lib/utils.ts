import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import logger from "./logger";
import {
  format,
  formatDistanceToNowStrict,
  formatDuration,
  intervalToDuration
} from "date-fns";
import { JSONSafe, UserAttributes } from "@/types";
import { IncomingHttpHeaders } from "http";
import { customAlphabet } from "nanoid";
import { fromError as fromZodError } from "zod-validation-error";
import randomBytes from "randombytes";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  input: Date | string | number | null | undefined,
  fmt?: string
): string {
  if (!input) {
    return "?";
  }
  const date = input instanceof Date ? input : new Date(input);
  return isNaN(date.getTime())
    ? "?"
    : fmt
      ? format(date, fmt)
      : date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        });
}

export const isFileSystemSafe = (name: string) => {
  const n = name.replace(/[^a-zA-Z0-9\._-]/g, "");
  if (n !== name) {
    return false;
  }

  if (n.length > 64) {
    return false;
  }

  if (n.length === 0) {
    return false;
  }

  // Does not start with a letter
  if (!n.match(/^[a-zA-Z]/)) {
    return false;
  }

  return true;
};

/** Periodically run a function until a promise is resolved */
export const runUntil = async <T>(
  promise: Promise<T>,
  fn?: () => Promise<unknown> | unknown,
  sleep = 20,
  timeout = 1000 * 60 * 10
) => {
  let value: T | undefined;
  let done: boolean = false;
  const startTime = Date.now();
  do {
    const res = await Promise.race([promise, { done: false }]);
    if (res && typeof res === "object" && "done" in res && res.done === false) {
      done = false;
    } else {
      done = true;
      value = res as T;
    }
    if (fn) {
      await fn();
    }
    await new Promise(resolve => setTimeout(resolve, sleep));
    if (Date.now() - startTime > timeout) {
      logger.warn("Execution timeout", timeout, "for", promise);
      throw new Error("Execution timeout");
    }
  } while (done === false);
  return value as T;
};

export function absoluteUrl(path?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  if (path) {
    return new URL(path, baseUrl).toString();
  } else {
    // Strip trailing slash
    const url = new URL(baseUrl).toString();
    return url.substring(0, url.length - 1);
  }
}

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const copy = {} as T;
  (Object.keys(obj) as K[])
    .filter(key => !keys.includes(key))
    .forEach(key => {
      copy[key] = obj[key];
    });
  return copy;
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  const copy = {} as Pick<T, K>;
  keys.forEach(key => {
    copy[key] = obj[key];
  });
  return copy;
};

/** Fetcher for useSWR */
export const fetcher = <JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> => {
  return fetch(input, init)
    .then(res => okstatus(res))
    .then(res => res.json() as Promise<JSON>);
};

export const fetcherTyped =
  <T>(schema: z.ZodType<T>) =>
  (input: RequestInfo, init?: RequestInit): Promise<z.output<typeof schema>> => {
    return fetcher(input, init)
      .then(schema.parse)
      .catch(error => {
        logger.error("Failed to fetch", formatMessage(error));
        reportError(error);
        throw error;
      });
  };

/** For useSWR("/api/user", fetcherIgnore404) to return just a null instead of an error. */
export const fetcherIgnore404 = <JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> => {
  return fetch(input, init)
    .then(res => okstatus(res, null))
    .then(res => res.json() as Promise<JSON>);
};

export const nums = (num: number, startAt = 0) => {
  return new Array(num).fill(0).map((_, i) => startAt + i);
};

export function formatCompactNumber(value: number) {
  if (value >= 100 && value < 1000) {
    return value.toString(); // Keep the number as is if it's in the hundreds
  } else if (value >= 1000 && value < 1000000) {
    const val = (value / 1000).toFixed(1);
    if (val.endsWith(".0")) {
      return val.slice(0, -2) + "k"; // Convert to 'k' for thousands
    } else {
      return val + "k"; // Convert to 'k' for thousands
    }
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M"; // Convert to 'M' for millions
  } else {
    return value.toString(); // Optionally handle numbers less than 100 if needed
  }
}

export function nFormatter(num?: number | null, digits?: number) {
  if (!num) {
    return "0";
  }
  const lookup = [
    { value: 1, symbol: " bytes" },
    { value: 1e3, symbol: "KB" },
    { value: 1e6, symbol: "MB" },
    { value: 1e9, symbol: "GB" },
    { value: 1e12, symbol: "TB" },
    { value: 1e15, symbol: "PB" },
    { value: 1e18, symbol: "EB" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol : "0";
}

export function capitalize(str: string) {
  if (!str || typeof str !== "string") {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function dashedToCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Convert thisValueIsNice to this Value Is Nice */
export const camelToSpaced = (str: string) =>
  str
    .replace(/([A-Z\/])/g, match => " " + (match === "/" ? "" : match))
    .replace(/^[-]+/, "")
    .split(" ")
    .map(s =>
      s === "Email"
        ? "E-mail"
        : s === "_id"
          ? "ID"
          : s === "Id"
            ? "ID"
            : s === "Url"
              ? "URL"
              : s
    )
    .join(" ")
    .trim();

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) {
    return str;
  }
  return `${str.slice(0, length)}...`;
};

/**
 * Response which can have { error: "msg" } response body
 *
 * DOM Response and node-fetch (v.2.6.7) response are different a bit so we
 * declare this type which is the only thing we need from fetch response
 **/
interface JSONResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url?: string;
  readonly headers: {
    get: (name: string) => string | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any>;
  text(): Promise<string>;
}

interface ErrorResponse extends Record<string, unknown> {
  error?: string;
  message?: string;
  description?: string;
  status?: number;
  response?: unknown;
}

const INSPECT_MAX_STRING_LENGTH = 20;
const INSPECT_MAX_ARRAY_LENGTH = 5;
const INSPECT_MAX_OBJECT_LENGTH = 5;

const inspectInternal = (
  val: unknown,
  depth: number,
  maxDepth: number,
  seen: WeakSet<WeakKey>
): string => {
  if (val === null) {
    return "null";
  }
  if (val === undefined) {
    return "undefined";
  }
  if (typeof val === "string") {
    if (val.length > INSPECT_MAX_STRING_LENGTH) {
      return `"${val.slice(0, INSPECT_MAX_STRING_LENGTH - 3)}..."`;
    }
    return `"${val}"`;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  if (typeof val === "bigint") {
    return `${val}n`;
  }
  if (typeof val === "symbol") {
    return val.toString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (val instanceof RegExp) {
    return val.toString();
  }
  if (typeof val === "function") {
    return `[Function ${val.name || "anonymous"}]`;
  }

  if (Array.isArray(val)) {
    if (depth >= maxDepth) {
      return "[...]";
    }
    if (seen.has(val)) {
      return "*circular*";
    }
    seen.add(val);

    const items =
      val.length > INSPECT_MAX_ARRAY_LENGTH
        ? [
            ...val
              .slice(0, INSPECT_MAX_ARRAY_LENGTH)
              .map(v => inspectInternal(v, depth + 1, maxDepth, seen)),
            "..."
          ]
        : val.map(v => inspectInternal(v, depth + 1, maxDepth, seen));

    return `[${items.join(", ")}]`;
  }

  if (typeof val === "object") {
    if (depth >= maxDepth) {
      return "{...}";
    }
    if (seen.has(val)) {
      return "*circular*";
    }
    seen.add(val);

    const entries = Object.entries(val);
    if (entries.length === 0) {
      return "{}";
    }

    if (entries.length > INSPECT_MAX_OBJECT_LENGTH) {
      const shown = entries
        .slice(0, INSPECT_MAX_OBJECT_LENGTH)
        .map(([k, v]) => `${k}: ${inspectInternal(v, depth + 1, maxDepth, seen)}`);
      return `{ ${shown.join(", ")}, ... }`;
    }

    return `{ ${entries
      .map(([k, v]) => `${k}: ${inspectInternal(v, depth + 1, maxDepth, seen)}`)
      .join(", ")} }`;
  }

  return String(val);
};

/** Deep inspect object, readable JSON.stringify alternative. */
export const inspect = (value: unknown, maxDepth = 3): string => {
  const seen = new WeakSet();
  return inspectInternal(value, 0, maxDepth, seen);
};

/**
 * Extracts meaningful error message from thrown object or JSON response
 **/
export const formatMessage = (obj: unknown): string => {
  const str =
    obj === null || obj === undefined || obj === ""
      ? "Unknown error"
      : typeof obj === "string"
        ? obj
        : typeof obj === "object"
          ? // { name: "ZodError" }
            "name" in obj && (obj as { name: string }).name === "ZodError"
            ? fromZodError(obj).toString()
            : "message" in obj &&
                (obj as { message: unknown }).message !== "" &&
                // Don't use generic message from { message: "[object Object]" }
                (obj as { message: unknown }).message !== "[object Object]"
              ? // { message: "..." }
                typeof (obj as { message: unknown }).message === "string"
                ? (obj as { message: string }).message
                : formatMessage(obj.message)
              : "error" in obj
                ? // { message: "..." }
                  typeof (obj as { error: unknown }).error === "string"
                  ? (obj as { error: string }).error
                  : formatMessage(obj.error)
                : "payload" in obj
                  ? formatMessage(obj.payload)
                  : inspect(obj)
          : inspect(obj);

  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const parsed = JSON.parse(str) as Record<string, unknown>;
      return formatMessage(parsed.message || parsed.error || parsed.description);
    } catch (_e) {
      // Don't care
    }
  }

  if (str.startsWith("[") && str.endsWith("]")) {
    try {
      const parsed = JSON.parse(str) as Record<string, unknown>[];
      return formatMessage(parsed[0]?.message || parsed[0]?.error || parsed[0]?.description);
    } catch (_e) {
      // Don't care
    }
  }

  if (str.startsWith("Error: ")) {
    return str.slice(7);
  }

  return str;
};

/** Works with ErrorReportProvider to display error */
const reportError = (message: unknown) => {
  const reportError = (
    globalThis as {
      reportError?: (message: string) => void;
    }
  ).reportError;

  if (reportError) {
    const str = formatMessage(message);
    reportError(str);
  }
};

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: StatusErrorCode,
    public payload?: Record<string, unknown>
  ) {
    super(message);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      payload: this.payload
    };
  }
}

/**
 * Checks fetch response and if not ok HTTP response, rejects with error from response.
 */
export const okstatus = <T extends JSONResponse>(
  response: T,
  use404fallback?: unknown /** If 404, return this value instead of rejecting. */,
  overrideReportError?: (message: unknown) => void
): Promise<T> =>
  new Promise((resolve, reject) => {
    if (response.ok) {
      resolve(response);
    } else {
      if (response.status === 404 && use404fallback !== undefined) {
        resolve({ ...response, json: () => Promise.resolve(use404fallback) });
        return;
      }

      // No content just pass as is
      if (response.status === 204) {
        resolve(response);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType === "application/json" || contentType?.startsWith("application/json")) {
        try {
          response
            .json()
            .then((body: ErrorResponse) => {
              const error = new HttpError(
                body.error || body.message || body.description || JSON.stringify(body),
                response.status as StatusErrorCode,
                body
              );

              Object.assign(error, {
                response: body
              });

              if (body.error || body.message || body.description) {
                (overrideReportError ?? reportError)(
                  body.error || body.message || body.description
                );
              } else {
                (overrideReportError ?? reportError)(JSON.stringify(body));
              }

              reject(error);
            })
            .catch(error => {
              const errWithMessage = error as { message?: string };
              const message = errWithMessage?.message || String(error);
              logger.warn(
                "Request",
                response.url,
                "failed, error",
                response.status,
                message,
                error,
                response.headers.get("content-type")
              );
              (overrideReportError ?? reportError)(message);
              reject(new HttpError(message, response.status as StatusErrorCode));
            });
        } catch (error) {
          const errWithMessage = error as { message?: string };
          const message = errWithMessage?.message || String(error);
          logger.warn(
            "Request",
            response.url,
            "failed, error",
            response.status,
            message,
            error,
            response.headers.get("content-type")
          );

          (overrideReportError ?? reportError)(message);
          reject(new HttpError(message, response.status as StatusErrorCode));
        }
      } else {
        logger.warn(
          "Request",
          response.url,
          "failed, error",
          response.status,
          response.statusText,
          response.headers.get("content-type")
        );
        (overrideReportError ?? reportError)(response.statusText);
        reject(new HttpError(response.statusText, response.status as StatusErrorCode));
      }
    }
  });

/** Disables button after click until promise is resolved */
export const clickOnce = <T>(
  e: React.MouseEvent<HTMLButtonElement>,
  fn: () => Promise<T>
): Promise<T> => {
  const elem = e.target as HTMLButtonElement;
  e.preventDefault();
  elem.disabled = true;
  return fn().finally(() => {
    elem.disabled = false;
  });
};

/**
 * Formats as "2 days ago", "15 mins ago" or "in 5 minutes"
 *
 * @param date {Date=} Date to format
 **/
export const formatDistanceTime = (date: Date | string | number | undefined | null) => {
  if (!date) {
    return undefined;
  }

  if (typeof date === "string") {
    date = new Date(date);
  }

  if (date instanceof Date && isNaN(date.getTime())) {
    return String(date);
  }

  try {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch (e) {
    logger.warn("Failed to parse", date, "error", e);
    return undefined;
  }
};

export const unjson = <T>(obj: JSONSafe<T>): T => {
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        let val = value;
        if (val && typeof val === "string" && val !== "" && key.endsWith("At")) {
          val = new Date(val);
        }
        return [key, val];
      })
    ) as T;
  } else {
    throw new Error("Not an object");
  }
};

export const unjsona = <T>(obj?: JSONSafe<T>[] | null): T[] => {
  if (!obj) {
    return [];
  }

  if (Array.isArray(obj)) {
    return obj.map(unjson);
  } else {
    throw new Error("Not an array");
  }
};

export const whereField = (field: string, value: string | string[] | undefined | null) => {
  if (!value) {
    return {};
  }

  if (Array.isArray(value)) {
    return { [field]: { in: value } };
  }

  return { [field]: value };
};

export const bool = (s: string | string[] | number | undefined | null | boolean) =>
  Array.isArray(s)
    ? s.includes("true") || s.includes("1")
    : typeof s === "boolean"
      ? s
      : s === "true" || s === "1" || s === 1;

/** Converts string or array of strings to string or undefined. */
export const str = (s: string | string[] | null | undefined) =>
  s === null
    ? undefined
    : s === undefined
      ? s
      : Array.isArray(s)
        ? s.length > 0
          ? s[0]
          : undefined
        : s;

const ifNaN = <T>(number: number, value: T): number | T => (isNaN(number) ? value : number);

/** Converts string or array of strings to int or undefined. */
export const int = (s: string | string[] | null | undefined | number): number | undefined =>
  s === null
    ? undefined
    : s === undefined
      ? s
      : Array.isArray(s)
        ? s.length > 0
          ? ifNaN(parseInt(s[0], 10), undefined)
          : undefined
        : typeof s === "number"
          ? s
          : ifNaN(parseInt(s, 10), undefined);

export const queryField = (field: string, value: string | string[] | undefined | null) => {
  if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "";
  } else {
    return `${field}=${encodeURIComponent(Array.isArray(value) ? value.join(",") : value)}`;
  }
};

/**
 * Filter out private IPs (both IPv6 or IPv4) and return possible IP
 * address for Source IP and Forwarded for header combination
 **/
export const getRealIp = (sourceIp?: string, forwardedFor?: string) => {
  const myIps = [
    ...(sourceIp ? [sourceIp] : []),
    ...(forwardedFor ? forwardedFor.split(/,/) : [])
  ]
    .filter(v => v !== undefined && v !== null && v.trim() !== "")
    .map(ip => ip.trim())
    .filter(
      ip =>
        ip !== "undefined" &&
        ip != "::1" &&
        !ip.startsWith("::ffff:10.") &&
        !ip.startsWith("::ffff:192.168.") &&
        !ip.startsWith("::ffff:127.0.")
    )
    .filter(
      ip => !ip.startsWith("127.0") && !ip.startsWith("192.168.") && !ip.startsWith("10.")
    )
    .map(ip => (ip.startsWith("::ffff:") ? ip.substring(7) : ip))
    .map(ip => ip.trim())
    .filter(ip => ip != "");

  return myIps.length > 0 ? myIps[0] : undefined;
};

/** Attempts to get IPv4 or IPv6 address of client or returns "?.?.?.?" */
export const getIP = (request?: {
  ip?: string;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  headers: IncomingHttpHeaders;
}): string =>
  getRealIp(
    request?.ip ||
      str(request?.headers["x-real-ip"]) ||
      request?.connection?.remoteAddress ||
      request?.socket?.remoteAddress,
    str(request?.headers["x-forwarded-for"])
  ) ?? "?.?.?.?";

export const formatElapsed = (startDate: Date, endDate: Date) => {
  if (startDate.getTime() > endDate.getTime()) {
    return "-";
  }

  const duration = intervalToDuration({ start: startDate, end: endDate });
  const zeroPad = (num: number) => String(num).padStart(2, "0");

  const formatted = formatDuration(duration, {
    format: ["hours", "minutes", "seconds"],
    zero: true,
    delimiter: ":",
    locale: {
      formatDistance: (_token, count) => zeroPad(count)
    }
  });

  return formatted.indexOf(":") < 0 ? parseInt(formatted, 10) + "s" : formatted;
};

/**
 * Returns a function that can be used to filter down objects
 * to the ones that have a defined non-null and not undefined value under the key `k`.
 *
 * After filtering, type of array is more strict.
 *
 * [{name: undefined}, {name: "John"}].filter(hasKey("name")) => [{name: "John"}]
 *
 * Source: https://github.com/robertmassaioli/ts-is-present/blob/master/src/index.ts
 */
export function hasKey<K extends string>(k: K) {
  return function <T, V>(a: T & { [k in K]?: V | null }): a is T & { [k in K]: V } {
    return a[k] !== undefined && a[k] !== null;
  };
}

/**
 * Returns a function that can be used to filter down objects
 * to the ones that have a specific value V under a key `k`.
 *
 * Source: https://github.com/robertmassaioli/ts-is-present/blob/master/src/index.ts
 */
export function hasKeyValue<K extends string, V>(k: K, v: V) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T>(a: T & { [k in K]: any }): a is T & { [k in K]: V } {
    return a[k] === v;
  };
}

export const minMaxAverage = (data: { value: number }[]) => {
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const average = data.reduce((acc, curr) => acc + curr.value, 0) / data.length;
  return { min, max, average };
};

export function calculatePeriodAverages(
  data: { date: Date; value: number }[],
  samplingInterval: number = 5 * 60 * 1000,
  startDate?: Date,
  endDate?: Date,
  dataInterval = 24 * 60 * 60 * 1000
) {
  const now = new Date();
  const startTime = startDate ?? new Date(now);
  const endTime = endDate ?? new Date(startTime.getTime() - dataInterval);
  const sortedData = data.sort((a, b) => a.date.getTime() - b.date.getTime());
  const averages: { date: Date; value: number }[] = [];
  let bucketStart = new Date(startTime.getTime() - samplingInterval);
  let bucketEnd = new Date(startTime.getTime());

  while (bucketStart >= endTime) {
    const bucketData = sortedData.filter(
      point => point.date > bucketStart && point.date <= bucketEnd
    );
    const sum = bucketData.reduce((acc, point) => acc + point.value, 0);
    const value = sum / bucketData.length;
    averages.push({ date: new Date(bucketStart.getTime() + samplingInterval / 2), value });
    bucketEnd = bucketStart;
    bucketStart = new Date(bucketEnd.getTime() - samplingInterval);
  }

  return averages;
}

export const hexView = (buffer: string | ArrayBuffer, options?: Record<string, unknown>) => {
  if (typeof buffer === "string") {
    buffer = Uint8Array.from(buffer, c => c.charCodeAt(0)).buffer;
  }
  const _options = {
    start: 0, // start viewing from given byte number
    escape: {
      // can be used to quickly point/filter interesting values
      "0": "--"
    },
    pad: "0", // padding sign
    width: 0x10, // -1 means that just one string only
    ...options
  };

  const view = new DataView(buffer);
  let start = _options.start;
  const length = view.byteLength;
  let result = "";
  let byteInRow = 0;
  let currentByte;
  let currentLine = "";
  let rowStart = start;

  while (start < length) {
    currentByte = view.getUint8(start);
    currentLine += " " + currentByte.toString(16).padStart(2, "0");
    byteInRow++;

    if (_options.width !== -1 && byteInRow >= _options.width) {
      result += rowStart.toString(16).padStart(2, "0") + ":" + currentLine + "\n";
      byteInRow = 0;
      currentLine = "";
      start++;
      rowStart = start;
    } else {
      start++;
    }
  }

  if (byteInRow > 0) {
    if (_options.width === -1) {
      return currentLine.trim();
    } else {
      result += rowStart.toString(16).padStart(2, "0") + ":" + currentLine + "\n";
    }
  }

  return result;
};

/** Filter array by false, undefined or null values */
export const nonFalse = <T>(a: T | false | null | undefined): a is T =>
  a !== null && a !== undefined && a !== false;

export const niceid = () =>
  customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12)();

export const pwgen = (n: number) =>
  customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", n)();

export const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

/**
 * Await whole object for all properties of object to execute, returns new object with all properties
 *
 * Usage: (await promiseObject({ property: Promise.resolve(value) })).property === value
 **/
export const promiseObject = async <T extends Record<string, Promise<unknown>>>(
  obj: T
): Promise<{
  [K in keyof T]: T[K] extends Promise<infer U> ? U : never;
}> => {
  const keys = Object.keys(obj) as (keyof T)[];
  const values = await Promise.all(Object.values(obj));
  const newObj = {} as { [K in keyof T]: T[K] extends Promise<infer U> ? U : never };
  return keys.reduce((obj, key, index) => {
    (obj[key] as unknown) = values[index];
    return obj;
  }, newObj);
};

/** Get IP address of the user / server */
export const getIpAddress = (): Promise<string> =>
  fetch("https://checkip.amazonaws.com")
    .then(response => response.text())
    .then(text => text.trim());

// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
export const isAbsoluteUrl = (url: string) => ABSOLUTE_URL_REGEX.test(url);

/**
 * Create random >= min && < max integer.
 * https://github.com/sarciszewski/OpenWireless/blob/f6f2615f92a30d489a312fe1277b0c784ff05c67/app/js/diceware.js
 * http://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues
 */
export const getRandomInt = (min: number, max: number): number => {
  let rval = 0;
  const range = max - min;

  const bitsNeeded = Math.ceil(Math.log2(range));
  if (bitsNeeded > 53) {
    throw new Error("We cannot generate numbers larger than 53 bits.");
  }
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const mask = Math.pow(2, bitsNeeded) - 1;
  // 7776 -> (2^13 = 8192) -1 == 8191 or 0x00001111 11111111

  // Create byte array and fill with N random numbers
  const byteArray = new Uint8Array(randomBytes(bytesNeeded));

  let p = (bytesNeeded - 1) * 8;
  for (let i = 0; i < bytesNeeded; i++) {
    rval += byteArray[i] * Math.pow(2, p);
    p -= 8;
  }

  // Use & to apply the mask and reduce the number of recursive lookups
  rval = rval & mask;

  if (rval >= range) {
    // Integer out of acceptable range
    return getRandomInt(min, max);
  }
  // Return an integer that falls within the range
  return min + rval;
};

/**
 * We run all the commands as bash -c "eval '$CMD'",
 * so using double quotes are fine, but single quotes should be
 * escaped as '\''
 */
export const escapeCmdQuotes = (str?: string | null | undefined) => {
  return str?.replace(/'/g, "'\\''") ?? "";
};

/** Check DollarDeploy running in production */
export const isProd = () => {
  return process.env.NEXT_PUBLIC_APP_URL === "https://dollardeploy.com";
};

/** Minimal API request interface, compatible with NextApiRequest */
export interface MinimalApiRequest {
  query: {
    [key: string]: string | string[] | undefined;
  };
  cookies: {
    [key: string]: string | string[] | undefined;
  };
  ip?: string;
  headers: {
    [key: string]: string | string[] | undefined;
  };
  connection?: {
    remoteAddress?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
  method?: string;
}

export type StatusErrorCode = 400 | 401 | 402 | 403 | 404 | 405 | 429 | 500;

export interface StatusHandler<K, E> {
  (status: 204): Omit<MinimalApiResponse, "status" | "redirect" | "json">;
  (status: StatusErrorCode): E;
  (status: 200): K;
}

/** Minimal API response interface, compatible with NextApiResponse<T> */
export interface MinimalApiResponse<T = {}> {
  status: StatusHandler<MinimalApiResponse<T>, MinimalApiResponse<{ message: string }>>;
  redirect: (status: 301 | 302 | 303 | 307 | 308, url: string) => void;
  json: (body: T) => void;
  end: () => void;
}

/** Gets attribution from query or from a cookie */
export const getAttribution = (req: MinimalApiRequest | string) => {
  const query =
    typeof req === "string"
      ? Object.fromEntries(new URLSearchParams(req).entries())
      : req.query;

  const cookie =
    typeof req === "string"
      ? {}
      : Object.fromEntries(new URLSearchParams(str(req.cookies?.attribution) || "").entries());

  // Do not add undefined
  const attribution: Omit<
    UserAttributes,
    "attributedAt" | "marketingOptIn" | "tosAcceptedAt" | "privacyPolicyAcceptedAt"
  > = Object.fromEntries(
    Object.entries({
      utmSource:
        str(query.utm_source) ??
        (query.gad_source === "1" ? "googleads" : undefined) ??
        cookie.utmSource,
      utmMedium: str(query.utm_medium) ?? cookie.utmMedium,
      utmCampaign: str(query.utm_campaign) ?? str(query.gad_campaignid) ?? cookie.utmCampaign,
      utmContent: str(query.utm_content) ?? cookie.utmContent,
      utmTerm: str(query.utm_term) ?? cookie.utmTerm,
      gclid: str(query.gclid) ?? cookie.gclid,
      gbraid: str(query.gbraid) ?? cookie.gbraid,
      wbraid: str(query.wbraid) ?? cookie.wbraid,
      fbclid: str(query.fbclid) ?? cookie.fbclid,
      referrer: str(query.ref) ?? cookie.referrer,
      ipAddress:
        typeof req === "string"
          ? undefined
          : getRealIp(
              req?.ip ||
                str(req?.headers["x-real-ip"]) ||
                req?.connection?.remoteAddress ||
                req?.socket?.remoteAddress,
              str(req?.headers["x-forwarded-for"])
            )
    } as Record<keyof Omit<UserAttributes, "attributedAt">, string | undefined>).filter(
      ([_, value]) => value !== undefined
    )
  );

  if (typeof window !== "undefined") {
    const ref = window.document.referrer || "";
    if (ref && !ref.startsWith(absoluteUrl()) && !ref.startsWith("http://localhost")) {
      attribution.referrer = attribution.referrer ? attribution.referrer : ref;
    }
  }

  if (Object.keys(attribution).length > 0) {
    return attribution;
  }

  return undefined;
};

/** Keeps the marketing parameters in the URL */
export const retainAttribution = (href?: string) => {
  if (!href) {
    href = "?";
  }
  const referrer = typeof window !== "undefined" ? window.document.referrer : "";
  const query = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const hash = href.indexOf("#") > -1 ? href.split("#")[1] : "";
  if (hash) {
    href = href.split("#")[0];
  }
  const path = href.indexOf("?") > -1 ? href.split("?")[0] : href;
  const newQuery = new URLSearchParams(href?.indexOf("?") > -1 ? href.split("?")[1] : "");
  const search = Object.entries({
    ...Object.fromEntries(
      Array.from(query.entries()).filter(([key]) => key !== "callbackUrl" && key !== "error")
    ),
    ...Object.fromEntries(newQuery.entries()),
    ...(!referrer ||
    referrer.startsWith(absoluteUrl()) ||
    referrer.startsWith("http://localhost")
      ? undefined
      : { referrer: new URL(referrer).hostname })
  })
    .map(([key, value]) =>
      Array.isArray(value)
        ? value.map(v => `${key}=${encodeURIComponent(v)}`).join("&")
        : value
          ? `${key}=${encodeURIComponent(value)}`
          : key
    )
    .join("&");
  return path + (search ? "?" + search : "") + (hash ? "#" + hash : "");
};

export const extractUrlPart = (value: string | number | boolean, part: string) => {
  const urlObj = new URL(String(value));

  if (!part) {
    throw new Error("Undefined URL part: " + part);
  }

  switch (part.toLowerCase()) {
    case "host":
      return urlObj.host;
    case "hostname":
      return urlObj.hostname;
    case "port":
      return urlObj.port ? parseInt(urlObj.port) : 0;
    case "path":
      return urlObj.pathname;
    case "username":
      return urlObj.username;
    case "password":
      return urlObj.password;
    case "database":
      return urlObj.pathname && urlObj.pathname.startsWith("/")
        ? urlObj.pathname.slice(1)
        : "";
    case "query":
      return urlObj.search ? urlObj.search.slice(1) : "";
    case "fragment":
      return urlObj.hash ? urlObj.hash.slice(1) : "";
    default:
      throw new Error("Unknown URL part: " + part);
  }
};

/** Replace environment references in a string */
export const interpolateValue = <T extends string | number | boolean>(
  val: T | undefined | null,
  env: Record<string, string | number | boolean>,
  seen?: string[]
): T | undefined | null => {
  if (!val) {
    return val;
  }

  if (typeof val !== "string") {
    return val;
  }

  if (typeof val === "string" && val.includes("${")) {
    return val.replace(/\$\{([^}]*)\}/g, (_, key) => {
      key = key.trim();
      if (key === "") {
        throw new Error("Empty variable reference: " + val);
      }

      if (seen?.includes(key)) {
        throw new Error("Circular reference: ${" + key + "}");
      }

      // Allow for references like DB_USERNAME=${MYSQL_URL:username}
      let part: string | undefined = undefined;

      if (key.indexOf(":") !== -1) {
        const parts = key.split(":");
        key = parts[0];
        part = parts[1];
      }

      let value = env[key];

      if (value === undefined || value === null) {
        throw new Error("No variable " + key + " found");
      }

      if (part) {
        value = extractUrlPart(value, part);
      }

      const v = interpolateValue(value, env, [...(seen || []), key]);
      if (v === undefined || v === null) {
        throw new Error("No variable " + key + " found");
      }

      return String(v);
    }) as T;
  } else {
    return val;
  }
};

/** Extrapolate environment, replacing all references to env vars */
export const interpolateEnv = (env: Record<string, string | number | boolean>) => {
  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => [key, interpolateValue(value, env, [key])])
  );
};

/** Shuffle array */
export const shuffle = <T>(arr: T[]): T[] => {
  return arr.sort(() => Math.random() - 0.5);
};

export function isArrayOfNumbers(arr: unknown): arr is number[] {
  if (!Array.isArray(arr)) {
    return false;
  }
  return arr.every(item => typeof item === "number");
}

export function isArrayOfDates(arr: unknown): arr is Date[] {
  if (!Array.isArray(arr)) {
    return false;
  }
  return arr.every(item => item instanceof Date);
}

export const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (_e) {
    return undefined;
  }
};

/**
 * Creates function which sorts by date field
 */
export const byDateField =
  <P extends string>(field: P, direction: "asc" | "desc" = "asc") =>
  (a: Record<P, Date>, b: Record<P, Date>): number => {
    const aa = a[field] instanceof Date ? a[field].getTime() : new Date(a[field]).getTime();
    const bb = b[field] instanceof Date ? b[field].getTime() : new Date(b[field]).getTime();
    return direction === "asc" ? aa - bb : bb - aa;
  };

export interface Abortable {
  abort: () => void;
}

/**
 * Wraps object into a proxy which supports aborting. If abort() is called,
 * any function call will throw an error.
 *
 * @param o - The object to wrap.
 * @param message - The message to throw when aborting.
 * @param errorOptions - The options to pass to the error.
 * @returns The wrapped object.
 */
export const abortable = <T extends object>(
  o: T,
  message = "Aborted",
  errorOptions: ErrorOptions | undefined = undefined
) => {
  let aborted = false;

  const p = new Proxy(o, {
    get: (target, key) => {
      if (typeof target[key as keyof T] !== "function") {
        return target[key as keyof T];
      } else if (typeof key === "symbol") {
        return target[key as keyof T];
      } else {
        const func = target[key as keyof T];
        if (typeof func !== "function") {
          return func;
        }

        return new Proxy(func as object, {
          apply: (_target, thisArg, argArray) => {
            if (aborted) {
              aborted = false;
              logger.warn("Aborting method", key, "(", ...argArray, ")");
              throw new Error(message, errorOptions);
            }
            return func.apply(thisArg, argArray);
          }
        });
      }
    }
  });

  const abortableLogger = p as T & { abort: () => void };

  abortableLogger.abort = () => {
    aborted = true;
  };

  return abortableLogger;
};

export const measureCall = <T extends unknown | Promise<unknown>>(
  mark: string,
  fn: () => T,
  warningThreshold = 100
): T => {
  const start = performance.now();
  const result = fn();
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();
      const duration = end - start;
      if (duration > warningThreshold) {
        logger.warn(mark, "elapsed", duration, "ms");
      } else if (logger.isVerbose) {
        logger.verbose(mark, "elapsed", duration, "ms");
      }
    }) as T;
  } else {
    const end = performance.now();
    const duration = end - start;
    if (duration > warningThreshold) {
      logger.warn(mark, "elapsed", duration, "ms");
    } else if (logger.isVerbose) {
      logger.verbose(mark, "elapsed", duration, "ms");
    }
  }
  return result;
};

export const assertNever = (value: never): never => {
  throw new Error("Unexpected value: " + String(value));
};
