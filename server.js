/**
 * Based on https://nextjs.org/docs/pages/building-your-application/configuring/custom-server
 */

// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-empty-function */
const { install } = require("source-map-support");
install();

// Install the log collector and request tracker before anything pulls in logs
const { getLogCollector } = require("./tools/log-collector");

const { createServer } = require("node:http");
const { parse } = require("node:url");
const createNextServer = require("next");
require("next");
const { initialize } = require("next/dist/server/lib/router-server");
const fs = require("node:fs");
const { getRequestTracker } = require("./tools/request-tracker");
const { queueState } = require("./lib/queue/queueState");
const { customAlphabet } = require("nanoid");
const path = require("node:path");
const { Chalk } = require("chalk");
const chalk = new Chalk();

/**
 * Filter out private IPs (both IPv6 or IPv4) and return possible IP
 * address for Source IP and Forwarded for header combination
 *
 * @param {string | string[] | undefined} sourceIp
 * @param {string | string[] | undefined} forwardedFor
 * @returns {string | undefined}
 **/
const getRealIp = (sourceIp, forwardedFor) => {
  const myIps = [
    ...(sourceIp ? (Array.isArray(sourceIp) ? sourceIp : [sourceIp]) : []),
    ...(forwardedFor
      ? Array.isArray(forwardedFor)
        ? forwardedFor.map(v => v.trim().split(/,/)).flat()
        : forwardedFor.split(/,/)
      : [])
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

class Level {
  constructor(level = "INFO") {
    this.level = level;
  }

  toString() {
    return new Date().toISOString() + " " + this.level;
  }

  /**
   * @param {string} hint
   */
  [Symbol.toPrimitive](hint) {
    if (hint === "string") {
      return new Date().toISOString() + " " + this.level;
    }
    return undefined;
  }
}

const verbose = process.env.NEXT_PUBLIC_LOG_VERBOSE === "1";

const logCollector = getLogCollector();
const logger = logCollector
  ? {
      verbose: verbose
        ? // @ts-ignore
          (...message) => logCollector.push({ level: "debug", message })
        : () => {},
      // @ts-ignore
      info: (...message) => logCollector.push({ level: "info", message }),
      // @ts-ignore
      warn: (...message) => logCollector.push({ level: "warn", message }),
      // @ts-ignore
      error: (...message) => logCollector.push({ level: "error", message })
    }
  : {
      verbose: verbose ? console.info : () => {},
      info: console.info.bind(console.info, "%s", new Level("INFO")),
      warn: console.warn.bind(console.warn, "%s", new Level("WARN")),
      error: console.error.bind(console.error, "%s", new Level("ERROR"))
    };

/** @param {string} s */
const dimColor = s => (s ? chalk.dim(s) : s);

const hostname = process.env.HOSTNAME ?? "127.0.0.1";
const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const keepAliveTimeout = process.env.KEEP_ALIVE_TIMEOUT
  ? parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10)
  : 60000;
const logIpAddress = process.env.SERVER_LOG_IP_ADDRESS === "1";
const gracefulShutdownTimeout = process.env.SERVER_SHUTDOWN_TIMEOUT
  ? parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT, 10)
  : 60000;

/** @type {import("next/dist/server/next").RequestHandler | undefined} */
let requestHandler = undefined;

/** @type {import("next/dist/server/next").UpgradeHandler | undefined} */
let upgradeHandler = undefined;

const pidFileName = process.env.SERVER_PID_FILE
  ? process.env.SERVER_PID_FILE.replace("{pid}", String(process.pid))
  : undefined;

if (pidFileName) {
  const dir = path.dirname(pidFileName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(pidFileName, String(process.pid));
}

let shutdown = false;

const niceid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  16
);

const requestTracker = getRequestTracker();

const server = createServer(
  {
    maxHeaderSize: 8192,
    insecureHTTPParser: false
  },
  /**
   * @param {import("http").IncomingMessage & { ip?: string, url?: string }} req
   * @param {import("http").ServerResponse<import("http").IncomingMessage>} res
   */
  async (req, res) => {
    if (process.env.SERVER_SOCKET_NODELAY === "1") {
      req.socket.setNoDelay(true);
    }

    if (process.env.SERVER_SOCKET_TIMEOUT) {
      req.socket.setTimeout(parseInt(process.env.SERVER_SOCKET_TIMEOUT, 10));
    }

    if (!req.url) {
      res.statusCode = 400;
      logger.warn("Bad request", req.url);
      res.end("Bad request");
      return;
    }

    const requestId = niceid();
    res.setHeader("X-Request-Id", requestId);

    // Resolve the client IP whenever it is needed by either sink: the plain
    // access lines (gated by logIpAddress) or the structured OTel log records
    // shipped by the collector.
    const ipAddress =
      logIpAddress || logCollector
        ? getRealIp(
            req?.ip ||
              req?.headers["x-real-ip"] ||
              req?.connection?.remoteAddress ||
              req?.socket?.remoteAddress,
            req?.headers["x-forwarded-for"]
          )
        : undefined;

    // Only echo the IP on the plain-text access lines when explicitly enabled;
    // the collector always ships it as structured data via the request tracker.
    const consoleIp = logIpAddress ? ipAddress : undefined;

    requestTracker?.withRequest(req, requestId, ipAddress);

    // The collector already prefixes every line with the requestId from the
    // tracker, so only include it in the access message when logging plainly.
    const idPrefix = logCollector ? [] : [dimColor(requestId)];

    const parsedUrl = parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const start = Date.now();
    const query = Object.entries(parsedUrl.query)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const noisyEndpoint =
      pathname?.startsWith("/api/stream") ||
      pathname?.startsWith("/api/queue/tick") ||
      pathname?.startsWith("/api/journal/latest") ||
      // /api/task/cmj88bejr0005xvq97i9wudx4
      pathname?.match(/^\/api\/task\/[a-z0-9]+$/) ||
      pathname?.startsWith("/_next") ||
      pathname?.startsWith("/__nextjs");

    if (!noisyEndpoint || verbose) {
      logger.info(...idPrefix, "-->", req.method, pathname, dimColor(query), consoleIp ?? "");
    }

    if (!requestHandler) {
      logger.warn(...idPrefix, "-->", req.method, pathname, "No NextJS request handler");
      res.statusCode = 500;
      res.end("Internal server error");
      return;
    }

    if (shutdown) {
      res.setHeader("Connection", "close");
    }

    await requestHandler(req, res, parsedUrl).then(() => {
      const elapsed = Date.now() - start;
      requestTracker?.withResponse({ elapsedMs: elapsed, statusCode: res.statusCode });
      if (!noisyEndpoint || verbose || elapsed > 100) {
        (res.statusCode >= 200 && res.statusCode < 300 ? logger.info : logger.warn)(
          ...idPrefix,
          res.statusCode > 399 ? chalk.red(res.statusCode) : res.statusCode,
          req.method,
          pathname,
          dimColor(query),
          consoleIp ? consoleIp + " Δ" : "Δ",
          elapsed,
          "ms"
        );
      }
    });
  }
);

server.timeout = 120000;
server.keepAliveTimeout = keepAliveTimeout;
server.headersTimeout = 10000;
server.requestTimeout = process.env.SERVER_REQUEST_TIMEOUT
  ? parseInt(process.env.SERVER_REQUEST_TIMEOUT, 10)
  : 600000;
server.maxHeadersCount = 100;

server.on("error", err => {
  logger.warn("Failed to launch server", err);
  throw new Error("Failed to launch server: " + new Error(err.message || String(err)));
});

server.on("upgrade", async (req, socket, head) => {
  if (!req.url) {
    logger.warn("Bad request", req.url);
    return;
  }

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  try {
    if (!upgradeHandler) {
      logger.warn("-->", req.method, pathname, "No NextJS request handler");
      return;
    }

    logger.warn("-->", req.method, pathname, "websocket upgrade");
    await upgradeHandler(req, socket, head);
  } catch (err) {
    socket.destroy();
    logger.warn(`Failed to handle upgrade request for ${pathname}`, err);
  }
});

server.on("listening", async () => {
  logger.info(
    `Next app listening at http://${hostname}:${port} (${
      dev ? "development" : process.env.NODE_ENV
    })`
  );

  const nextBuild = fs.existsSync(".next/required-server-files.json")
    ? // @ts-ignore
      require("./.next/required-server-files.json")
    : undefined;

  /** @type {import('next').NextConfig | undefined} */
  const config = /** @type {any} */ (nextBuild?.config);

  if (config?.output === "standalone") {
    if (dev) {
      logger.warn("NextJS standalone server is not supported in development mode");
      process.exit(1);
    }

    // https://github.com/vercel/next.js/issues/64031
    // process.env.__NEXT_PRIVATE_RENDER_WORKER = "yes";
    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);

    const result = await initialize({
      dir: ".",
      port,
      hostname,
      // @ts-ignore
      config,
      dev: false,
      minimalMode: false,
      server,
      isNodeDebugging: false,
      keepAliveTimeout,
      experimentalTestProxy: false,
      experimentalHttpsServer: false
    });

    if (!result || !result.requestHandler || !result.upgradeHandler) {
      logger.warn("Invalid NextJS handlers", result);
      process.exit(1);
    }

    requestHandler = result.requestHandler;
    upgradeHandler = result.upgradeHandler;
    logger.info("NextJS standalone server ready, pid", process.pid);
  } else {
    /** @type {import("next/dist/server/next").NextServerOptions & import("next/dist/server/next").NextBundlerOptions} */
    const options = {
      dev,
      customServer: true,
      hostname,
      port,
      httpServer: server,
      webpack: true
    };

    let app;
    /** @type {any} override bad types in next.js */
    const method = createNextServer;
    /** @type {(options: import("next/dist/server/next").NextServerOptions & import("next/dist/server/next").NextBundlerOptions) => Promise<import("next/dist/server/next").NextServer>} */
    const createServer = method;
    app = await createServer(options);
    await app.prepare();
    requestHandler = app.getRequestHandler();
    upgradeHandler = app.getUpgradeHandler();
    logger.info("NextJS server ready, pid", process.pid);
  }

  // https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
  if (process.send) {
    process.send("ready");
  }
});

/** Pings queue */
const timer = setInterval(async () => {
  if (shutdown) {
    return;
  }

  logger.verbose("Periodic queue processing");
  try {
    await queueState.process();
  } catch (error) {
    logger.error("Error processing queue", error);
  }
}, 60000);

const abortController = new AbortController();
server.listen({
  port,
  hostname,
  signal: abortController.signal,
  ...(process.env.SERVER_REUSE_PORT === "1" ? { reusePort: true } : {})
});

/** @param {number | undefined} [timeout] */
const gracefulShutdown = async timeout => {
  logger.info("Graceful shutdown");
  abortController.abort();
  let connections = 0;
  let tasks = 0;
  let reportedStatus = 0;
  let started = Date.now();
  do {
    tasks = queueState.length();
    connections = await new Promise((resolve, reject) =>
      server.getConnections((err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      })
    );

    if (Date.now() - reportedStatus > 2000) {
      logger.info("Wait for shutdown, connections", connections, "tasks", tasks);
      reportedStatus = Date.now();
    }

    if (timeout && Date.now() - started > timeout) {
      logger.warn("Graceful shutdown: Timeout");
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  } while (connections > 0 || tasks > 0);
  logger.info("Graceful shutdown: Done");
  return true;
};

const shutdownHandler = () => {
  if (process.env.QUEUE_STANDALONE !== "1") {
    // Queue is processed locally
    queueState.dump(true);
  }
  clearInterval(timer);
  server.close();

  if (pidFileName && fs.existsSync(pidFileName)) {
    try {
      fs.unlinkSync(pidFileName);
    } catch (error) {}
  }
};

process.on("SIGINT", async () => {
  if (shutdown) {
    return;
  }
  shutdown = true;
  logger.warn("SIGINT: Shutting down...");
  await gracefulShutdown(gracefulShutdownTimeout);
  shutdownHandler();
  await logCollector?.shutdown();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  if (shutdown) {
    return;
  }
  shutdown = true;
  logger.info("SIGTERM: Shutting down...");
  await gracefulShutdown(gracefulShutdownTimeout);
  shutdownHandler();
  await logCollector?.shutdown();
  process.exit(0);
});
