/**
 * Based on https://nextjs.org/docs/pages/building-your-application/configuring/custom-server
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-empty-function */

const { createServer } = require("node:http");
const { parse } = require("node:url");
const createNextServer = require("next");
require("next");
const { initialize } = require("next/dist/server/lib/router-server");
const fs = require("node:fs");
const { queueState } = require("./lib/queue/queueState");

/**
 * Filter out private IPs (both IPv6 or IPv4) and return possible IP
 * address for Source IP and Forwarded for header combination
 *
 * @param {string} sourceIp
 * @param {string} forwardedFor
 * @returns {string | undefined}
 **/
const getRealIp = (sourceIp, forwardedFor) => {
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

const logger = console;
logger.verbose = process.env.NEXT_PUBLIC_LOG_VERBOSE === "1" ? logger.info : () => {};

const hostname = process.env.HOSTNAME ?? "127.0.0.1";
const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const keepAliveTimeout = process.env.KEEP_ALIVE_TIMEOUT
  ? parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10)
  : 60000;
const logIpAddress = process.env.SERVER_LOG_IP_ADDRESS === "1";

let requestHandler = undefined;
let upgradeHandler = undefined;

const __write = process.stdout.write;

const server = createServer(
  {
    maxHeaderSize: 8192,
    insecureHTTPParser: false
  },
  async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const start = Date.now();
    const ipAddress = logIpAddress
      ? getRealIp(
          req?.ip ||
            req?.headers["x-real-ip"] ||
            req?.connection?.remoteAddress ||
            req?.socket?.remoteAddress,
          req?.headers["x-forwarded-for"]
        )
      : undefined;

    const logAccess =
      !parsedUrl.pathname.startsWith("/api/stream") &&
      !parsedUrl.pathname.startsWith("/api/queue/tick") &&
      !parsedUrl.pathname.startsWith("/_next") &&
      !parsedUrl.pathname.startsWith("/__nextjs");

    if (logAccess) {
      logger.info("-->", req.method, parsedUrl.pathname, ipAddress ?? "");
    }

    if (!requestHandler) {
      logger.warn("-->", req.method, parsedUrl.pathname, "No NextJS request handler");
      res.statusCode = 500;
      res.end("Internal server error");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      // https://github.com/vercel/next.js/discussions/65992
      process.stdout.write = (...args) => {
        if (!(args[0].startsWith(" GET") || args[0].startsWith(" POST"))) {
          __write.apply(process.stdout, args);
        }
      };
    }

    await requestHandler(req, res, parsedUrl).then(() => {
      if (logAccess) {
        logger.info(
          "<--",
          res.statusCode,
          req.method,
          parsedUrl.pathname,
          ipAddress ? ipAddress + " Δ" : "Δ",
          Date.now() - start,
          "ms"
        );
      }
    });
  }
);

server.timeout = 120000;
server.keepAliveTimeout = keepAliveTimeout;
server.headersTimeout = 10000;
server.requestTimeout = 120000;
server.maxHeadersCount = 100;

server.on("error", err => {
  logger.warn("Failed to launch server", err);
  throw new Error("Failed to launch server: " + new Error(err.message || String(err)));
});

server.on("upgrade", async (req, socket, head) => {
  const parsedUrl = parse(req.url, true);

  if (!upgradeHandler) {
    logger.warn("-->", req.method, parsedUrl.pathname, "No NextJS request handler");
    return;
  }

  try {
    logger.warn("-->", req.method, parsedUrl.pathname, "websocket upgrade");
    await upgradeHandler(req, socket, head);
  } catch (err) {
    socket.destroy();
    logger.warn(`Failed to handle upgrade request for ${req.url}`, err);
  }
});

server.on("listening", async () => {
  logger.info(
    `Next app listening at http://${hostname}:${port} (${
      dev ? "development" : process.env.NODE_ENV
    })`
  );

  const nextBuild = fs.existsSync(".next/required-server-files.json")
    ? require("./.next/required-server-files.json")
    : undefined;

  /** @type {import('next').NextConfig} */
  const config = nextBuild?.config;

  if (config?.output === "standalone") {
    if (dev) {
      logger.warn("NextJS standalone server is not supported in development mode");
      process.exit(1);
    }

    // https://github.com/vercel/next.js/issues/64031
    //process.env.__NEXT_PRIVATE_RENDER_WORKER = "yes";
    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);

    const handlers = await initialize({
      dir: ".",
      port,
      hostname,
      config,
      dev: false,
      minimalMode: false,
      server,
      isNodeDebugging: false,
      keepAliveTimeout,
      experimentalTestProxy: false,
      experimentalHttpsServer: false
    });

    if (
      !handlers ||
      handlers.requestHandler === undefined ||
      handlers.upgradeHandler === undefined
    ) {
      logger.warn("Invalid NextJS handlers", handlers);
      process.exit(1);
    }

    requestHandler = handlers.requestHandler;
    upgradeHandler = handlers.upgradeHandler;
    logger.info("NextJS standalone server ready");
  } else {
    /** @type {import("next/dist/server/next").NextServerOptions} */
    const options = {
      dev,
      customServer: true,
      hostname,
      port,
      httpServer: server
    };

    /** @type {import("next/dist/server/next").NextServer} */
    const app = createNextServer(options);
    await app.prepare();
    requestHandler = app.getRequestHandler();
    upgradeHandler = app.getUpgradeHandler();
    logger.info("NextJS server ready");
  }

  // https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
  if (process.send) {
    process.send("ready");
  }
});

const timer = setInterval(async () => {
  logger.verbose("Periodic queue processing");
  try {
    await queueState.process();
  } catch (error) {
    logger.error("Error processing queue", error);
  }
}, 60000);

process.on("SIGINT", () => {
  logger.warn("SIGINT: Shutting down...");
  if (process.env.QUEUE_STANDALONE !== "1") {
    // Queue is processed locally
    queueState.dump(true);
  }
  clearInterval(timer);
  server.close();
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM: Shutting down...");
  if (process.env.QUEUE_STANDALONE !== "1") {
    // Queue is processed locally
    queueState.dump(true);
  }
  clearInterval(timer);
  server.close();
  process.exit(0);
});

server.listen(port, hostname);
