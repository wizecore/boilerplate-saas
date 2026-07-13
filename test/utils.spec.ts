import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import logger from "@/lib/logger";
import {
  formatMessage,
  inspect,
  formatDate,
  isFileSystemSafe,
  absoluteUrl,
  omit,
  pick,
  nFormatter,
  capitalize,
  truncate,
  getIP,
  formatElapsed,
  hasKey,
  nonFalse,
  uniq,
  promiseObject,
  okstatus,
  cn,
  runUntil,
  fetcher,
  fetcherIgnore404,
  formatCompactNumber,
  HttpError,
  clickOnce,
  formatDistanceTime,
  unjson,
  unjsona,
  whereField,
  bool,
  str,
  int,
  queryField,
  getRealIp,
  minMaxAverage,
  calculatePeriodAverages,
  hexView,
  niceid,
  pwgen,
  getIpAddress,
  isAbsoluteUrl,
  getRandomInt,
  escapeCmdQuotes,
  isProd,
  getAttribution,
  retainAttribution,
  shuffle,
  isArrayOfNumbers,
  isArrayOfDates,
  isValidHostname,
  sleep,
  normalize,
  underscoreToCamel,
  shortId,
  shorten,
  normalizeEmail,
  parseDate
} from "@/lib/utils";
import { z } from "zod";

describe("formatMessage", () => {
  it("should handle null and undefined", () => {
    expect(formatMessage(null)).toBe("Unknown error");
    expect(formatMessage(undefined)).toBe("Unknown error");
    expect(formatMessage("")).toBe("Unknown error");
  });

  it("should handle plain strings", () => {
    expect(formatMessage("Test error")).toBe("Test error");
    expect(formatMessage("Connection failed")).toBe("Connection failed");
  });

  it("should handle Error objects", () => {
    expect(formatMessage(new Error("Test error"))).toBe("Test error");
    expect(formatMessage(new TypeError("Type error"))).toBe("Type error");
  });

  it("should handle objects with message property", () => {
    expect(formatMessage({ message: "Object error" })).toBe("Object error");
    expect(formatMessage({ message: "API failed", code: 500 })).toBe("API failed");
  });

  it("should handle objects with error property", () => {
    expect(formatMessage({ error: "Error occurred" })).toBe("Error occurred");
    expect(formatMessage({ error: "Invalid input", status: 400 })).toBe("Invalid input");
  });

  it("should handle the payload property", () => {
    expect(formatMessage({ payload: { message: "Payload error" } })).toBe("Payload error");
    expect(formatMessage({ payload: { message: { error: "Payload error" } } })).toBe(
      "Payload error"
    );
  });

  it("should handle nested error objects", () => {
    const nestedError = {
      message: {
        error: "Nested error"
      }
    };
    expect(formatMessage(nestedError)).toBe("Nested error");
  });

  it("should handle ZodError objects", () => {
    const schema = z.object({
      age: z.number().min(18)
    });
    try {
      schema.parse({ age: 17 });
    } catch (e) {
      expect(formatMessage(e)).toBe(
        'Validation error: Number must be greater than or equal to 18 at "age"'
      );
    }
  });

  it("should handle JSON string errors", () => {
    expect(formatMessage('{"message":"JSON error"}')).toBe("JSON error");
    expect(formatMessage('{"error":"JSON failure"}')).toBe("JSON failure");
  });

  it("should handle array of errors", () => {
    expect(formatMessage('[{"message":"First error"}]')).toBe("First error");
    expect(formatMessage('[{"error":"Array error"}]')).toBe("Array error");
  });

  it("should handle Error: prefix", () => {
    expect(formatMessage("Error: Connection timeout")).toBe("Connection timeout");
    expect(formatMessage("Error: Failed to fetch")).toBe("Failed to fetch");
  });

  it("should handle complex error objects", () => {
    const complexError = {
      status: 500,
      code: "INTERNAL_ERROR",
      message: {
        details: "Something went wrong",
        error: "Internal server error"
      }
    };
    expect(formatMessage(complexError)).toBe("Internal server error");
  });

  it("should handle non-standard error objects", () => {
    const customError = {
      status: 404,
      description: "Resource not found"
    };
    expect(formatMessage(customError)).toBe(
      '{ status: 404, description: "Resource not found" }'
    );
  });
});

describe("inspect", () => {
  it("should handle primitive values", () => {
    expect(inspect(null)).toBe("null");
    expect(inspect(undefined)).toBe("undefined");
    expect(inspect(123)).toBe("123");
    expect(inspect("test")).toBe('"test"');
    expect(inspect(true)).toBe("true");
    expect(inspect(false)).toBe("false");
    expect(inspect(BigInt(123))).toBe("123n");
    expect(inspect(Symbol("test"))).toBe("Symbol(test)");
  });

  it("should handle long strings", () => {
    const longString = "a".repeat(100);
    expect(inspect(longString)).toBe('"aaaaaaaaaaaaaaaaa..."');
  });

  it("should handle arrays", () => {
    expect(inspect([1, 2, 3])).toBe("[1, 2, 3]");
    expect(inspect([1, "test", true])).toBe('[1, "test", true]');
    expect(inspect([1, 2, 3, 4, 5, 6])).toBe("[1, 2, 3, 4, 5, ...]");
  });

  it("should handle objects", () => {
    expect(inspect({ a: 1, b: "test" })).toBe('{ a: 1, b: "test" }');
    expect(inspect({})).toBe("{}");
  });

  it("should handle nested objects", () => {
    const nested = {
      a: {
        b: {
          c: "deep"
        }
      }
    };
    expect(inspect(nested)).toBe('{ a: { b: { c: "deep" } } }');
    expect(inspect(nested, 1)).toBe("{ a: {...} }");
  });

  it("should handle dates", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    expect(inspect(date)).toBe("2024-01-01T00:00:00.000Z");
  });

  it("should handle functions", () => {
    const namedFn = function test() {
      return true;
    };
    const anonFn = () => true;
    expect(inspect(namedFn)).toBe("[Function test]");
    expect(inspect(anonFn)).toBe("[Function anonFn]");
    expect(inspect(() => {})).toBe("[Function anonymous]");
  });

  it("should handle circular references", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(inspect(circular)).toBe("{ self: *circular* }");
    const arr: unknown[] = [1, 2, 3];
    arr.push(arr);
    arr.push(4);
    arr.push(5);
    arr.push(6);
    expect(inspect(arr)).toBe("[1, 2, 3, *circular*, 4, ...]");
  });

  it("should handle RegExp", () => {
    expect(inspect(/test/g)).toBe("/test/g");
  });

  it("should respect maxDepth parameter", () => {
    const deep = { a: { b: { c: { d: "deep" } } } };
    expect(inspect(deep, 2)).toBe("{ a: { b: {...} } }");
  });
});

describe("formatDate", () => {
  it("should handle null and undefined", () => {
    expect(formatDate(null)).toBe("?");
    expect(formatDate(undefined)).toBe("?");
  });

  it("should format dates with default format", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    expect(formatDate(date)).toBe("January 1, 2024");
  });

  it("should format dates with custom format", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    expect(formatDate(date, "yyyy-MM-dd")).toBe("2024-01-01");
  });

  it("should handle invalid dates", () => {
    expect(formatDate("invalid-date")).toBe("?");
  });
});

describe("isFileSystemSafe", () => {
  it("should allow valid filenames", () => {
    expect(isFileSystemSafe("test.txt")).toBe(true);
    expect(isFileSystemSafe("my-file_123.js")).toBe(true);
  });

  it("should reject invalid filenames", () => {
    expect(isFileSystemSafe("test/file")).toBe(false);
    expect(isFileSystemSafe("file\\name")).toBe(false);
    expect(isFileSystemSafe("file:name")).toBe(false);
  });

  it("should allow longer names", () => {
    expect(isFileSystemSafe("abcabcabca-evolution_evolution_instances")).toBe(true);
  });
});

describe("okstatus", () => {
  const reportError = vi.fn();

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).reportError = reportError;
    logger.warn = vi.fn();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).reportError = undefined;
    logger.warn = vi.fn();
  });

  it("should report error on 400 error response", async () => {
    try {
      await okstatus({
        status: 400,
        ok: false,
        statusText: "Bad Request",
        headers: new Headers({
          "content-type": "application/json"
        }),
        json: () => Promise.resolve({ message: "Error occurred" }),
        text: () => Promise.resolve("Error occurred")
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Error occurred");
      expect(reportError).toHaveBeenCalledWith("Error occurred");
    }
  });

  it("should ignore 404 if asked to", async () => {
    expect(
      await okstatus(
        {
          status: 404,
          ok: false,
          statusText: "Not Found",
          headers: new Headers({
            "content-type": "application/json"
          }),
          json: () => Promise.resolve({ message: "Not Found" }),
          text: () => Promise.resolve("Not Found")
        },
        null
      )
        .then(response => response.json())
        .then(data => data)
    ).toBe(null);
  });
});

describe("absoluteUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return base URL without trailing slash", () => {
    expect(absoluteUrl()).toBe("https://example.com");
  });

  it("should append path to base URL", () => {
    expect(absoluteUrl("/api/test")).toBe("https://example.com/api/test");
  });

  it("should append wrongish path to base URL", () => {
    expect(absoluteUrl("api/test")).toBe("https://example.com/api/test");
  });

  it("should throw error when NEXT_PUBLIC_APP_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(() => absoluteUrl()).toThrow("NEXT_PUBLIC_APP_URL is not set");
  });
});

describe("omit", () => {
  it("should omit specified keys from object", () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    expect(omit(obj, "a", "c")).toEqual({ b: 2, d: 4 });
  });

  it("should handle empty object", () => {
    const obj = {} as { a: never };
    expect(omit(obj, "a")).toEqual({});
  });

  it("should handle non-existent keys", () => {
    const obj = { a: 1 };
    expect(omit(obj, "b" as keyof typeof obj)).toEqual({ a: 1 });
  });
});

describe("pick", () => {
  it("should pick specified keys from object", () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    expect(pick(obj, "a", "c")).toEqual({ a: 1, c: 3 });
  });

  it("should handle empty object", () => {
    const obj = {} as { a: never };
    expect(pick(obj, "a")).toEqual({});
  });

  it("should handle non-existent keys", () => {
    const obj = { a: 1 };
    expect(pick(obj, "a", "b" as keyof typeof obj)).toEqual({ a: 1 });
  });
});

describe("nFormatter", () => {
  it("should format bytes", () => {
    expect(nFormatter(500)).toBe("500 bytes");
    expect(nFormatter(1024)).toBe("1KB");
    expect(nFormatter(1024 * 1024)).toBe("1MB");
    // FIXME: too big numbers does not work (use BigInt)
    // expect(nFormatter(1024 * 1024 * 1024)).toBe("1GB");
  });

  it("should handle null and undefined", () => {
    expect(nFormatter(null)).toBe("0");
    expect(nFormatter(undefined)).toBe("0");
  });

  it("should handle zero", () => {
    expect(nFormatter(0)).toBe("0");
  });

  it("should format with custom digits", () => {
    expect(nFormatter(1536, 2)).toBe("1.54KB");
  });
});

describe("capitalize", () => {
  it("should capitalize first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("world")).toBe("World");
  });

  it("should handle empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("should handle already capitalized string", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("should handle non-string input", () => {
    expect(capitalize(123 as unknown as string)).toBe(123 as unknown as string);
  });
});

describe("truncate", () => {
  it("should truncate long strings", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("should not truncate short strings", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("getIP", () => {
  it("should extract IP from headers", () => {
    const req = {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        "x-real-ip": "9.10.11.12"
      }
    };
    expect(getIP(req)).toBe("9.10.11.12");
  });

  it("should handle missing headers", () => {
    const req = { headers: {} };
    expect(getIP(req)).toBe("?.?.?.?");
  });

  it("should filter private IPs", () => {
    const req = {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1, 1.2.3.4"
      }
    };
    expect(getIP(req)).toBe("1.2.3.4");
  });
});

describe("formatElapsed", () => {
  it("should format time difference", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-01T01:30:45Z");
    expect(formatElapsed(start, end)).toBe("01:30:45");
  });

  it("should handle invalid time range", () => {
    const start = new Date("2024-01-01T01:00:00Z");
    const end = new Date("2024-01-01T00:00:00Z");
    expect(formatElapsed(start, end)).toBe("-");
  });

  it("should format short durations", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const end = new Date("2024-01-01T00:00:30Z");
    expect(formatElapsed(start, end)).toBe("30s");
  });
});

describe("hasKey", () => {
  it("should filter objects with defined key", () => {
    const arr = [{ name: "John" }, { name: undefined }, { name: null }, {}];
    expect(arr.filter(hasKey("name"))).toEqual([{ name: "John" }]);
  });
});

describe("nonFalse", () => {
  it("should filter out false values", () => {
    const arr = [1, false, 2, null, 3, undefined, 4];
    expect(arr.filter(nonFalse)).toEqual([1, 2, 3, 4]);
  });
});

describe("uniq", () => {
  it("should remove duplicates", () => {
    expect(uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(uniq(["a", "b", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("should handle empty array", () => {
    expect(uniq([])).toEqual([]);
  });
});

describe("promiseObject", () => {
  it("should resolve object of promises", async () => {
    const obj = {
      a: Promise.resolve(1),
      b: Promise.resolve("test"),
      c: Promise.resolve(true)
    };
    const result = await promiseObject(obj);
    expect(result).toEqual({ a: 1, b: "test", c: true });
  });

  it("should handle empty object", async () => {
    const result = await promiseObject({});
    expect(result).toEqual({});
  });
});

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("btn", "btn-primary")).toBe("btn btn-primary");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", true && "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar")).toBe("foo");
  });

  it("should handle arrays and objects", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });
});

describe("formatCompactNumber", () => {
  it("should format numbers correctly", () => {
    expect(formatCompactNumber(50)).toBe("50");
    expect(formatCompactNumber(500)).toBe("500");
    expect(formatCompactNumber(1000)).toBe("1k");
    expect(formatCompactNumber(1001)).toBe("1k");
    expect(formatCompactNumber(10000)).toBe("10k");
    expect(formatCompactNumber(1500)).toBe("1.5k");
    expect(formatCompactNumber(1000000)).toBe("1.0M");
    expect(formatCompactNumber(2500000)).toBe("2.5M");
  });

  it("should handle edge cases", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(99)).toBe("99");
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(999999)).toBe("1000k");
  });
});

describe("HttpError", () => {
  it("should create error with status code", () => {
    const error = new HttpError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
    expect(error).toBeInstanceOf(Error);
  });

  it("should create error with different status codes", () => {
    const error500 = new HttpError("Internal server error", 500);
    expect(error500.statusCode).toBe(500);

    const error401 = new HttpError("Unauthorized", 401);
    expect(error401.statusCode).toBe(401);
  });
});

describe("formatDistanceTime", () => {
  it("should format distance to now", () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = formatDistanceTime(oneHourAgo);
    expect(result).toBe("1 hour ago");
  });

  it("should handle null and undefined", () => {
    expect(formatDistanceTime(null)).toBeUndefined();
    expect(formatDistanceTime(undefined)).toBeUndefined();
  });

  it("should handle string dates", () => {
    const result = formatDistanceTime("2024-01-01");
    expect(typeof result).toBe("string");
  });

  it("should handle invalid dates", () => {
    const result = formatDistanceTime("invalid-date");
    expect(result).toBe("Invalid Date");
  });
});

describe("unjson", () => {
  it("should convert JSON dates back to Date objects", () => {
    const input = {
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      name: "test"
    };
    const result = unjson(input);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.name).toBe("test");
  });

  it("should handle objects without date fields", () => {
    const input = { name: "test", value: 123 };
    const result = unjson(input);
    expect(result).toEqual(input);
  });

  it("should throw error for non-objects", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => unjson("not an object" as any)).toThrow("Not an object");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => unjson(null as any)).toThrow("Not an object");
  });
});

describe("unjsona", () => {
  it("should convert array of JSON objects", () => {
    const input = [
      { createdAt: "2024-01-01T00:00:00.000Z", name: "test1" },
      { createdAt: "2024-01-02T00:00:00.000Z", name: "test2" }
    ];
    const result = unjsona(input);
    expect(result).toHaveLength(2);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[1].createdAt).toBeInstanceOf(Date);
  });

  it("should handle null and undefined", () => {
    expect(unjsona(null)).toEqual([]);
    expect(unjsona(undefined)).toEqual([]);
  });

  it("should throw error for non-arrays", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => unjsona({} as any)).toThrow("Not an array");
  });
});

describe("whereField", () => {
  it("should create single value filter", () => {
    expect(whereField("name", "john")).toEqual({ name: "john" });
  });

  it("should create array filter", () => {
    expect(whereField("status", ["active", "pending"])).toEqual({
      status: { in: ["active", "pending"] }
    });
  });

  it("should handle null and undefined", () => {
    expect(whereField("name", null)).toEqual({});
    expect(whereField("name", undefined)).toEqual({});
  });
});

describe("bool", () => {
  it("should convert string to boolean", () => {
    expect(bool("true")).toBe(true);
    expect(bool("1")).toBe(true);
    expect(bool("false")).toBe(false);
    expect(bool("0")).toBe(false);
    expect(bool("")).toBe(false);
    expect(bool(null)).toBe(false);
    expect(bool(undefined)).toBe(false);
    expect(bool("xxxx")).toBe(false);
  });

  it("should handle arrays", () => {
    expect(bool(["true", "false"])).toBe(true);
    expect(bool(["1", "0"])).toBe(true);
    expect(bool(["false", "0"])).toBe(false);
  });

  it("should handle actual booleans", () => {
    expect(bool(true)).toBe(true);
    expect(bool(false)).toBe(false);
  });

  it("should handle null and undefined", () => {
    expect(bool(null)).toBe(false);
    expect(bool(undefined)).toBe(false);
  });
});

describe("str", () => {
  it("should extract string from single value", () => {
    expect(str("test")).toBe("test");
    expect(str(["test"])).toBe("test");
  });

  it("should handle arrays", () => {
    expect(str(["first", "second"])).toBe("first");
    expect(str([])).toBeUndefined();
  });

  it("should handle null and undefined", () => {
    expect(str(null)).toBeUndefined();
    expect(str(undefined)).toBeUndefined();
  });
});

describe("int", () => {
  it("should convert string to int", () => {
    expect(int("123")).toBe(123);
    expect(int(["456"])).toBe(456);
  });

  it("should handle numbers", () => {
    expect(int(789)).toBe(789);
  });

  it("should handle arrays", () => {
    expect(int(["123", "456"])).toBe(123);
    expect(int([])).toBeUndefined();
  });

  it("should handle null and undefined", () => {
    expect(int(null)).toBeUndefined();
    expect(int(undefined)).toBeUndefined();
  });

  it("should handle invalid numbers", () => {
    expect(int("abc")).toBeUndefined();
    // FIXME: should not accept such numbers
    expect(int("123abc")).toBe(123);
  });
});

describe("queryField", () => {
  it("should create query string", () => {
    expect(queryField("name", "john")).toBe("name=john");
    expect(queryField("status", ["active", "pending"])).toBe("status=active%2Cpending");
  });

  it("should handle empty values", () => {
    expect(queryField("name", "")).toBe("");
    expect(queryField("name", null)).toBe("");
    expect(queryField("name", undefined)).toBe("");
    expect(queryField("name", [])).toBe("");
  });

  it("should encode special characters", () => {
    expect(queryField("name", "john doe")).toBe("name=john%20doe");
    expect(queryField("query", "a&b")).toBe("query=a%26b");
  });
});

describe("getRealIp", () => {
  it("should extract real IP from headers", () => {
    expect(getRealIp("1.2.3.4", "5.6.7.8, 9.10.11.12")).toBe("1.2.3.4");
  });

  it("should filter private IPs", () => {
    expect(getRealIp("192.168.1.1", "10.0.0.1, 1.2.3.4")).toBe("1.2.3.4");
    expect(getRealIp("127.0.0.1", "1.2.3.4")).toBe("1.2.3.4");
  });

  it("should handle IPv6", () => {
    expect(getRealIp("::ffff:1.2.3.4", "")).toBe("1.2.3.4");
    expect(getRealIp("::1", "1.2.3.4")).toBe("1.2.3.4");
  });

  it("should return undefined if no public IP found", () => {
    expect(getRealIp("192.168.1.1", "10.0.0.1")).toBeUndefined();
    expect(getRealIp("", "")).toBeUndefined();
  });
});

describe("minMaxAverage", () => {
  it("should calculate min, max, and average", () => {
    const data = [{ value: 1 }, { value: 5 }, { value: 3 }];
    const result = minMaxAverage(data);
    expect(result.min).toBe(1);
    expect(result.max).toBe(5);
    expect(result.average).toBe(3);
  });

  it("should handle single value", () => {
    const data = [{ value: 42 }];
    const result = minMaxAverage(data);
    expect(result.min).toBe(42);
    expect(result.max).toBe(42);
    expect(result.average).toBe(42);
  });
});

describe("hexView", () => {
  it("should create hex view of buffer", () => {
    const result = hexView("test");
    expect(result).toContain("74 65 73 74");
  });

  it("should handle ArrayBuffer", () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view[0] = 116; // 't'
    view[1] = 101; // 'e'
    view[2] = 115; // 's'
    view[3] = 116; // 't'
    const result = hexView(buffer);
    expect(result).toContain("74 65 73 74");
  });

  it("should handle options", () => {
    const result = hexView("test", { width: -1 });
    expect(result).toBe("74 65 73 74");
  });
});

describe("niceid", () => {
  it("should generate ID of correct length", () => {
    const id = niceid();
    expect(id).toHaveLength(12);
    expect(/^[0-9a-zA-Z]+$/.test(id)).toBe(true);
  });

  it("should generate unique IDs", () => {
    const id1 = niceid();
    const id2 = niceid();
    expect(id1).not.toBe(id2);
  });
});

describe("pwgen", () => {
  it("should generate password of specified length", () => {
    const pw = pwgen(16);
    expect(pw).toHaveLength(16);
    expect(/^[0-9a-zA-Z]+$/.test(pw)).toBe(true);
  });

  it("should generate different passwords", () => {
    const pw1 = pwgen(8);
    const pw2 = pwgen(8);
    expect(pw1).not.toBe(pw2);
  });
});

describe("isAbsoluteUrl", () => {
  it("should identify absolute URLs", () => {
    expect(isAbsoluteUrl("https://example.com")).toBe(true);
    expect(isAbsoluteUrl("http://test.com")).toBe(true);
    expect(isAbsoluteUrl("ftp://files.com")).toBe(true);
  });

  it("should identify relative URLs", () => {
    expect(isAbsoluteUrl("/path/to/resource")).toBe(false);
    expect(isAbsoluteUrl("relative/path")).toBe(false);
    expect(isAbsoluteUrl("../parent")).toBe(false);
  });
});

describe("getRandomInt", () => {
  it("should generate number in range", () => {
    for (let i = 0; i < 10; i++) {
      const num = getRandomInt(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThan(10);
    }
  });

  it("should handle different ranges", () => {
    const num = getRandomInt(100, 200);
    expect(num).toBeGreaterThanOrEqual(100);
    expect(num).toBeLessThan(200);
  });
});

describe("escapeCmdQuotes", () => {
  it("should escape single quotes", () => {
    expect(escapeCmdQuotes("don't")).toBe("don'\\''t");
    expect(escapeCmdQuotes("it's")).toBe("it'\\''s");
  });

  it("should handle strings without quotes", () => {
    expect(escapeCmdQuotes("hello")).toBe("hello");
  });

  it("should handle null and undefined", () => {
    expect(escapeCmdQuotes(null)).toBe("");
    expect(escapeCmdQuotes(undefined)).toBe("");
  });
});

describe("isProd", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it("should return true for production environment", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dollardeploy.com";
    expect(isProd()).toBe(true);
  });

  it("should return false for development environment", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://dev.dollardeploy.com";
    expect(isProd()).toBe(false);
  });
});

describe("shuffle", () => {
  it("should return array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...arr]);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("should handle empty array", () => {
    expect(shuffle([])).toEqual([]);
  });
});

describe("isArrayOfNumbers", () => {
  it("should identify arrays of numbers", () => {
    expect(isArrayOfNumbers([1, 2, 3])).toBe(true);
    expect(isArrayOfNumbers([1.5, 2.7, 3.9])).toBe(true);
    expect(isArrayOfNumbers([])).toBe(true);
  });

  it("should reject arrays with non-numbers", () => {
    expect(isArrayOfNumbers([1, "2", 3])).toBe(false);
    expect(isArrayOfNumbers([1, null, 3])).toBe(false);
  });

  it("should reject non-arrays", () => {
    expect(isArrayOfNumbers("not array")).toBe(false);
    expect(isArrayOfNumbers(123)).toBe(false);
    expect(isArrayOfNumbers(null)).toBe(false);
  });
});

describe("isArrayOfDates", () => {
  it("should identify arrays of dates", () => {
    const dates = [new Date(), new Date("2024-01-01")];
    expect(isArrayOfDates(dates)).toBe(true);
    expect(isArrayOfDates([])).toBe(true);
  });

  it("should reject arrays with non-dates", () => {
    expect(isArrayOfDates([new Date(), "2024-01-01"])).toBe(false);
    expect(isArrayOfDates([new Date(), null])).toBe(false);
  });

  it("should reject non-arrays", () => {
    expect(isArrayOfDates("not array")).toBe(false);
    expect(isArrayOfDates(new Date())).toBe(false);
    expect(isArrayOfDates(null)).toBe(false);
  });
});

describe("runUntil", () => {
  it("should resolve when promise resolves", async () => {
    const promise = Promise.resolve("result");
    const result = await runUntil(promise);
    expect(result).toBe("result");
  });

  it("should call function periodically", async () => {
    const fn = vi.fn();
    const promise = Promise.resolve("result");
    await runUntil(promise, fn, 10);
    expect(fn).toHaveBeenCalled();
  });

  it("should timeout after specified time", async () => {
    const promise = new Promise(() => {}); // Never resolves
    await expect(runUntil(promise, undefined, 10, 50)).rejects.toThrow("Execution timeout");
  });
});

describe("fetcher", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch and parse JSON", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: "test" })
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await fetcher("/api/test");
    expect(result).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalledWith("/api/test", undefined);
  });
});

describe("fetcherIgnore404", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should ignore 404 errors", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: () => Promise.resolve(null)
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await fetcherIgnore404("/api/test");
    expect(result).toBeNull();
  });
});

describe("getIpAddress", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("should fetch IP address", async () => {
    const mockResponse = {
      text: () => Promise.resolve("1.2.3.4\n")
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await getIpAddress();
    expect(result).toBe("1.2.3.4");
    expect(mockFetch).toHaveBeenCalledWith("https://checkip.amazonaws.com");
  });
});

describe("clickOnce", () => {
  it("should disable button and re-enable after promise", async () => {
    const mockButton = { disabled: false } as HTMLButtonElement;
    const mockEvent = {
      target: mockButton,
      preventDefault: vi.fn()
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    const fn = vi.fn().mockResolvedValue("result");

    const result = await clickOnce(mockEvent, fn);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
    expect(result).toBe("result");
    expect(mockButton.disabled).toBe(false);
  });

  it("should re-enable button even if promise rejects", async () => {
    const mockButton = { disabled: false } as HTMLButtonElement;
    const mockEvent = {
      target: mockButton,
      preventDefault: vi.fn()
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    const fn = vi.fn().mockRejectedValue(new Error("test error"));

    try {
      await clickOnce(mockEvent, fn);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(mockButton.disabled).toBe(false);
  });
});

describe("calculatePeriodAverages", () => {
  it("should calculate period averages", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 1000), value: 10 },
      { date: new Date(now.getTime() - 2000), value: 20 },
      { date: new Date(now.getTime() - 3000), value: 30 }
    ];

    const result = calculatePeriodAverages(data, 5000, now);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle empty data", () => {
    const result = calculatePeriodAverages([]);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getAttribution", () => {
  it("should extract attribution from query string", () => {
    const req = {
      query: { utm_source: "google", utm_medium: "cpc", ref: "https://example.com" },
      cookies: {},
      headers: {}
    };

    const result = getAttribution(req);
    expect(result).toEqual({
      utmSource: "google",
      utmMedium: "cpc",
      referrer: "https://example.com"
    });
  });

  it("should handle string input", () => {
    const result = getAttribution("utm_source=facebook&utm_medium=social");
    expect(result).toEqual({
      utmSource: "facebook",
      utmMedium: "social"
    });
  });

  it("should return undefined if no attribution found", () => {
    const req = {
      query: {},
      cookies: {},
      headers: {}
    };

    const result = getAttribution(req);
    expect(result).toBeUndefined();
  });
});

describe("retainAttribution", () => {
  it("should return path when no window", () => {
    const result = retainAttribution("/new-page");
    expect(result).toBe("/new-page");
  });

  it("should handle URLs with existing query params", () => {
    const result = retainAttribution("/page?existing=param");
    expect(result).toBe("/page?existing=param");
  });

  it("should handle URLs with existing referrer", () => {
    const result = retainAttribution("/page?ref=google&utm_source=google");
    expect(result).toBe("/page?ref=google&utm_source=google");
  });

  it("should handle empty href", () => {
    const result = retainAttribution();
    expect(result).toBe("");
  });
});

describe("isValidHostname", () => {
  it("accepts valid hostnames", () => {
    expect(isValidHostname("example.com")).toBe(true);
    expect(isValidHostname("sub.domain.example.com")).toBe(true);
    expect(isValidHostname("localhost")).toBe(true);
    expect(isValidHostname("EXAMPLE.COM")).toBe(true);
    expect(isValidHostname("xn--80ak6aa92e.com")).toBe(true);
  });

  it("ignores a single trailing dot", () => {
    expect(isValidHostname("example.com.")).toBe(true);
  });

  it("rejects empty, whitespace and empty labels", () => {
    expect(isValidHostname("")).toBe(false);
    expect(isValidHostname("   ")).toBe(false);
    expect(isValidHostname("a..b")).toBe(false);
    expect(isValidHostname("has space.com")).toBe(false);
  });

  it("rejects leading/trailing hyphens and illegal characters", () => {
    expect(isValidHostname("-lead.com")).toBe(false);
    expect(isValidHostname("trail-.com")).toBe(false);
    expect(isValidHostname("under_score.com")).toBe(false);
  });

  it("rejects labels over 63 chars and names over 253 chars", () => {
    expect(isValidHostname("a".repeat(64) + ".com")).toBe(false);
    const longName = (label => `${label}.${label}.${label}.${label}`)("a".repeat(63));
    expect(longName.length).toBeGreaterThan(253);
    expect(isValidHostname(longName)).toBe(false);
  });
});

describe("sleep", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves only after the given delay", async () => {
    let resolved = false;
    const promise = sleep(1000).then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(resolved).toBe(true);
  });
});

describe("normalize", () => {
  it("trims surrounding whitespace", () => {
    expect(normalize("  hello  ")).toBe("hello");
    expect(normalize("  hello world  ")).toBe("hello world");
  });

  it("clamps to the default maximum length", () => {
    expect(normalize("a".repeat(100))).toHaveLength(60);
  });

  it("trims before clamping to a custom maximum", () => {
    expect(normalize("  abcdef  ", 3)).toBe("abc");
    expect(normalize("")).toBe("");
  });
});

describe("underscoreToCamel", () => {
  it("converts underscore_case to camelCase", () => {
    expect(underscoreToCamel("hello_world")).toBe("helloWorld");
    expect(underscoreToCamel("foo_bar_baz")).toBe("fooBarBaz");
  });

  it("leaves strings without lowercase-led underscores untouched", () => {
    expect(underscoreToCamel("nochange")).toBe("nochange");
    expect(underscoreToCamel("with_123")).toBe("with_123");
  });
});

describe("shortId", () => {
  it("returns the last 8 characters of a cuid", () => {
    expect(shortId("clabc123def456ghi")).toBe("ef456ghi");
    expect(shortId("abcdefghijklmnop")).toBe("ijklmnop");
  });

  it("returns the whole string when shorter than 8", () => {
    expect(shortId("short")).toBe("short");
  });
});

describe("shorten", () => {
  it("passes through undefined", () => {
    expect(shorten(undefined)).toBeUndefined();
  });

  it("leaves short strings untouched", () => {
    expect(shorten("short")).toBe("short");
    expect(shorten("hello", 5)).toBe("hello");
  });

  it("truncates and appends ellipsis when over the max", () => {
    expect(shorten("a".repeat(300))).toHaveLength(250);
    expect(shorten("a".repeat(300))?.endsWith("...")).toBe(true);
    expect(shorten("abcdef", 5)).toBe("ab...");
  });
});

describe("normalizeEmail", () => {
  it("lowercases and returns a valid address", () => {
    expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("extracts an address from surrounding text", () => {
    expect(normalizeEmail("mailto:john@example.com please")).toBe("john@example.com");
  });

  it("canonicalizes gmail dotted local parts", () => {
    expect(normalizeEmail("john.doe@gmail.com")).toBe("johndoe@gmail.com");
  });

  it("returns undefined when there is no valid email", () => {
    expect(normalizeEmail("not an email")).toBeUndefined();
  });
});

describe("parseDate", () => {
  const base = new Date("2024-01-15T12:00:00.000Z");

  it("subtracts relative durations from the base date", () => {
    expect(parseDate("1d", base).toISOString()).toBe("2024-01-14T12:00:00.000Z");
    expect(parseDate("2 days", base).toISOString()).toBe("2024-01-13T12:00:00.000Z");
    expect(parseDate("30m", base).toISOString()).toBe("2024-01-15T11:30:00.000Z");
  });

  it("parses absolute dates", () => {
    expect(parseDate("2020-06-01").toISOString()).toBe("2020-06-01T00:00:00.000Z");
  });

  it("throws HttpError on invalid input", () => {
    expect(() => parseDate("not a date")).toThrow(HttpError);
  });
});
