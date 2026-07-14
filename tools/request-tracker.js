const { AsyncLocalStorage } = require("node:async_hooks");

// Render text dim using raw ANSI escapes (equivalent to chalk.dim). We avoid
// importing chalk here because this module is bundled by webpack via
// lib/middleware.ts, and chalk is ESM-only which webpack cannot bundle.
const ESC = String.fromCharCode(27);

// Mirror chalk's own gating: only emit ANSI escapes when stdout is an
// interactive terminal, and honor the NO_COLOR convention. This is guarded so
// it stays safe in a browser bundle, where `process`/`process.stdout` may be
// absent (accessing `.isTTY` would otherwise throw).
const supportsColor = () =>
  typeof process !== "undefined" &&
  process.env.NO_COLOR == null &&
  Boolean(process.stdout && process.stdout.isTTY);

/** @param {string} text */
const dim = text => (supportsColor() ? `${ESC}[2m${text}${ESC}[22m` : text);

/**
 * @typedef {{
 * requestId: string,
 * url?: string,
 * ip?: string,
 * taskId?: string,
 * taskType?: string,
 * elapsedMs?: number,
 * statusCode?: number,
 * userId?: string,
 * tenantId?: string, authMethod?: string
 * }} RequestTrackerStore */

/** @type {AsyncLocalStorage<RequestTrackerStore>} */
const asyncLocalStorage = new AsyncLocalStorage();

class RequestTracker {
  constructor() {}

  toString() {
    const requestId = this.getContext()?.requestId;
    return requestId ? requestId : "";
  }

  /**
   * Enters async chain with specific request.
   *
   * @param {Pick<import('http').IncomingMessage, "url">} req
   * @param {string} requestId
   * @param {string} [ip]
   **/
  withRequest(req, requestId, ip) {
    asyncLocalStorage.enterWith({
      requestId: requestId,
      url: req.url,
      ip
    });
  }

  /**
   * Enters async chain for a queue task being processed.
   *
   * @param {{ id: string, type: string, tenantId: string }} task
   * @param {string} requestId
   */
  withTask(task, requestId) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.requestId = requestId;
      store.taskId = task.id;
      store.taskType = task.type;
      store.tenantId = task.tenantId;
    } else {
      asyncLocalStorage.enterWith({
        requestId,
        taskId: task.id,
        taskType: task.type,
        tenantId: task.tenantId
      });
    }
  }

  /**
   * Records the current request's response details.
   *
   * @param {{ elapsedMs: number, statusCode: number }} response
   */
  withResponse({ elapsedMs, statusCode }) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.elapsedMs = elapsedMs;
      store.statusCode = statusCode;
    }
  }

  /**
   * Records the current request's authentication details.
   *
   * @param {{ method: "api"|"session", userId: string, tenantId: string }} auth
   */
  withAuth({ method, userId, tenantId }) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.userId = userId;
      store.tenantId = tenantId;
      store.authMethod = method;
    }
  }

  /**
   * Returns current request details, if any.
   *
   * @returns {RequestTrackerStore|undefined}
   */
  getContext() {
    return asyncLocalStorage.getStore();
  }

  /**
   * This is used by the logger to print the requestId.
   * @param {string} hint
   */
  [Symbol.toPrimitive](hint) {
    if (hint === "string") {
      const requestId = this.getContext()?.requestId;
      return requestId ? " " + dim(requestId) : "";
    }
    return null;
  }
}

/** @type {{ __requestTracker: RequestTracker | undefined }} */
const context = /** @type {any} */ (globalThis);

// The request tracker is also needed by the log collector to tag every shipped
// log record with its requestId and url, so install it when log collection is on.
if (
  !context.__requestTracker &&
  (process.env.LOG_REQUEST_TRACKER === "1" || process.env.OPENTELEMETRY_LOGS_ENABLED === "1")
) {
  // eslint-disable-next-line no-console
  console.info("Installing async request tracker...");
  context.__requestTracker = new RequestTracker();
}

/**
 * @returns {RequestTracker|undefined}
 */
const getRequestTracker = () => {
  return context.__requestTracker;
};

module.exports = {
  getRequestTracker
};
