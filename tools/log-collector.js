/* eslint-disable no-console */
/**
 * Log collector that ships application logs to an OpenTelemetry logs endpoint
 * (for example VictoriaLogs, see
 * https://docs.victoriametrics.com/victorialogs/data-ingestion/opentelemetry/)
 * and optionally mirrors them to the console.
 *
 * It is installed on globalThis.__logCollector and consumed by lib/logger.ts and
 * server.js: every logger.info()/warn()/verbose()/error() call is pushed here as
 * { level, message, timestamp }. Extra fields (requestId, url) are pulled from
 * the async request tracker (tools/request-tracker.js) so every log record can be
 * correlated to the request that produced it.
 *
 * Controlled via env (see .env.example)
 */
const util = require("node:util");
const { Chalk } = require("chalk");
const { getRequestTracker } = require("./request-tracker");

const chalk = new Chalk();

/**
 * @typedef {{
 *   level: "debug" | "info" | "warn" | "error",
 *   message: unknown[],
 *   timestamp?: number
 * }} LogMessage
 */

// Strip terminal colors before shipping so the stored log body stays clean.
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
/** @param {string} s */
const stripAnsi = s => s.replace(ANSI_PATTERN, "");

/** @type {Record<string, "info"|"warn"|"error">} */
const CONSOLE_METHOD = { debug: "info", info: "info", warn: "warn", error: "error" };

// OpenTelemetry SeverityNumber values (see @opentelemetry/api-logs SeverityNumber).
const SEVERITY_NUMBER = { debug: 5, info: 9, warn: 13, error: 17 };

class LogCollector {
  constructor() {
    this.toConsole = process.env.OPENTELEMETRY_LOGS_CONSOLE !== "0";

    /** @type {import("@opentelemetry/api-logs").Logger | undefined} */
    this.otelLogger = undefined;

    /** @type {import("@opentelemetry/sdk-logs").LoggerProvider | undefined} */
    this.provider = undefined;

    const url = process.env.OPENTELEMETRY_LOGS_URL;
    if (url) {
      this.setupOtel(url);
    } else {
      console.warn("Log collector: OPENTELEMETRY_LOGS_URL is not set, log shipping disabled");
    }
  }

  /**
   * Build the OpenTelemetry logs pipeline. Required lazily so the SDK is only
   * loaded when shipping is actually enabled.
   *
   * @param {string} url
   */
  setupOtel(url) {
    const { LoggerProvider, BatchLogRecordProcessor } = require("@opentelemetry/sdk-logs");
    // Protobuf encoding (the -proto exporter): VictoriaLogs only accepts
    // protobuf-encoded OTLP logs, not JSON (the -http exporter).
    const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-proto");
    const { resourceFromAttributes } = require("@opentelemetry/resources");
    const {
      ATTR_SERVICE_NAME,
      ATTR_SERVICE_VERSION
    } = require("@opentelemetry/semantic-conventions");

    const username = process.env.OPENTELEMETRY_LOGS_USERNAME;
    const password = process.env.OPENTELEMETRY_LOGS_PASSWORD;
    const token = process.env.OPENTELEMETRY_LOGS_TOKEN;
    const headers = token
      ? {
          Authorization: `Bearer ${token}`
        }
      : username
        ? {
            Authorization:
              "Basic " + Buffer.from(`${username}:${password ?? ""}`).toString("base64")
          }
        : undefined;

    // Generic service name for the template; override with the env var per app.
    const serviceName = process.env.OPENTELEMETRY_LOGS_SERVICE_NAME ?? "app";

    const exporter = new OTLPLogExporter({ url, headers });
    const provider = new LoggerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]:
          process.env.OPENTELEMETRY_LOGS_SERVICE_VERSION ?? process.env.GIT_TAGS ?? "unknown"
      }),
      processors: [new BatchLogRecordProcessor(exporter)]
    });

    this.provider = provider;
    this.otelLogger = provider.getLogger(serviceName);
    console.info("Log collector: shipping logs to", url);
  }

  /**
   * Receive a log record from the loggers and fan it out to the console and the
   * OpenTelemetry exporter.
   *
   * @param {LogMessage} log
   */
  push(log) {
    const { level, message, timestamp } = log;
    const request = getRequestTracker()?.getContext();

    if (this.toConsole) {
      this.writeConsole(level, message, request?.requestId);
    }

    if (this.otelLogger) {
      this.writeOtel(level, message, timestamp, request);
    }
  }

  /**
   * @param {"debug"|"info"|"warn"|"error"} level
   * @param {unknown[]} message
   * @param {string|undefined} requestId
   */
  writeConsole(level, message, requestId) {
    const method = CONSOLE_METHOD[level] || "info";
    const prefix = new Date().toISOString() + " " + level.toUpperCase();
    if (requestId) {
      console[method]("%s%s", prefix, " " + chalk.dim(requestId), ...message);
    } else {
      console[method]("%s", prefix, ...message);
    }
  }

  /**
   * @param {"debug"|"info"|"warn"|"error"} level
   * @param {unknown[]} message
   * @param {number|undefined} timestamp
   * @param {{requestId?: string, url?: string, ip?: string, elapsedMs?: number, statusCode?: number, authMethod?: string, userId?: string, tenantId?: string, taskId?: string, taskType?: string}|undefined} request
   */
  writeOtel(level, message, timestamp, request) {
    if (!this.otelLogger) {
      return;
    }

    /** @type {Record<string, string|number>} */
    const attributes = {};

    if (request && request.requestId) {
      attributes.request_id = request.requestId;
    }

    if (request && request.url) {
      attributes.url = request.url;
    }

    if (request && request.ip) {
      attributes.ip = request.ip;
    }

    if (request && typeof request.elapsedMs === "number") {
      attributes.elapsed_ms = request.elapsedMs;
    }

    if (request && typeof request.statusCode === "number") {
      attributes.status_code = request.statusCode;
    }

    if (request && request.authMethod) {
      attributes.auth_method = request.authMethod;
    }

    if (request && request.userId) {
      attributes.user_id = request.userId;
    }

    if (request && request.tenantId) {
      attributes.tenant_id = request.tenantId;
    }

    if (request && request.taskId) {
      attributes.task_id = request.taskId;
    }

    if (request && request.taskType) {
      attributes.task_type = request.taskType;
    }

    const ts = timestamp || Date.now();
    this.otelLogger.emit({
      severityNumber: SEVERITY_NUMBER[level] || SEVERITY_NUMBER.info,
      severityText: level.toUpperCase(),
      body: stripAnsi(util.format(...message)),
      timestamp: ts,
      observedTimestamp: ts,
      attributes
    });
  }

  /** Flush pending records and stop the exporter. Best effort. */
  async shutdown() {
    if (!this.provider) {
      return;
    }
    try {
      await this.provider.shutdown();
    } catch (error) {
      console.warn("Log collector: error during shutdown", error);
    }
  }
}

/** @type {{ __logCollector?: LogCollector }} */
const context = /** @type {any} */ (globalThis);

if (!context.__logCollector && process.env.OPENTELEMETRY_LOGS_ENABLED === "1") {
  console.info("Installing log collector...");
  context.__logCollector = new LogCollector();
}

/**
 * @returns {LogCollector|undefined}
 */
const getLogCollector = () => {
  return context.__logCollector;
};

module.exports = {
  getLogCollector
};
