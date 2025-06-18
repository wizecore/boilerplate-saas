import crypto from "crypto";
import assert from "assert";

/** NodeJS. Hash the  value. */
export const createHash = (value: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
};

export const createHmac = (value: string, key: string) => {
  assert(value !== "");
  assert(key !== "");
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(value);
  return hmac.digest("hex");
};

/** NodeJS. Create SHA out of value. */
export const createSHA = (value: string) => {
  const hash = crypto.createHash("sha1");
  hash.update(value);
  return hash.digest("hex");
};

export const md5 = (str: string) => crypto.createHash("md5").update(str).digest("hex");

const DEFAULT_TIMEOUT = 10000;

// https://dmitripavlutin.com/timeout-fetch-request/
export const fetchWithTimeout = async (
  url: RequestInfo,
  init?: RequestInit & {
    /** Timeout in milliseconds, default 10s */
    timeout?: number;
  }
) => {
  const timeout = init?.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort("Request timeout " + timeout + " ms");
  }, timeout);

  try {
    const response: Response | undefined = await fetch(url, {
      ...init,
      // FIXME: signal definitions are incompatible
      signal: controller.signal
    } satisfies RequestInit);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return response;
  } catch (e) {
    if (timedOut) {
      const ee = new Error("Request timeout " + timeout + " ms");
      ee.cause = e;
      throw ee;
    } else {
      throw e;
    }
  }
};
