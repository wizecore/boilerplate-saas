import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";

import logger from "@/lib/logger";

/** Guest port PostgreSQL listens on inside the sandbox. */
const PG_GUEST_PORT = 5432;
/** First host port to try; the scan walks 5432, 5433, ... from here. */
const PG_HOST_PORT = 5432;
/** How many sequential ports to try before giving up. */
const PG_PORT_SCAN = 64;
/** Stable sandbox name so restarts reuse a single instance. */
const PG_SANDBOX_NAME = "boilerplate-pg";
/**
 * Named volume holding the cluster. Host bind mounts fail on this runtime
 * (virtiofs mount -> ENOTDIR), so the data lives in a microsandbox-managed
 * volume rather than a host path.
 */
const PG_VOLUME_NAME = "boilerplate-pg-data";
/** postgres:18 wants the mount at the parent; it keeps data in a versioned subdir. */
const PG_GUEST_MOUNT = "/var/lib/postgresql";
const PG_IMAGE = "postgres:18";
const PG_PASSWORD = process.env.POSTGRES_PASSWORD ?? "postgres";
const PG_MEMORY = "1G";
const PG_CPUS = "2";

/**
 * The `msb` binary shipped with the microsandbox package. Driving the CLI is
 * deliberate: only `msb run -d` runs the image entrypoint as a persistent
 * background process — the SDK's `create()` merely boots an idle VM.
 */
function msbBin(): string {
  return path.join(process.cwd(), "node_modules", "microsandbox", "bin", "microsandbox.cjs");
}

function msb(args: string[]): {
  status: number;
  stdout: string;
  stderr: string;
} {
  const r = spawnSync(process.execPath, [msbBin(), ...args], {
    encoding: "utf8"
  });
  return { status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

interface SandboxState {
  exists: boolean;
  running: boolean;
  /** Published host port, parsed from the status PORTS column. */
  hostPort?: number;
}

/** Query the sandbox via `msb status`, parsing its published host port. */
function sandboxState(): SandboxState {
  const { status, stdout } = msb(["status", PG_SANDBOX_NAME]);
  if (status !== 0) {
    return { exists: false, running: false };
  }
  const line = stdout.split("\n").find(l => l.includes(PG_SANDBOX_NAME));
  const running = !!line && /\brunning\b/.test(line);
  const portMatch = line?.match(/127\.0\.0\.1:(\d+)->/);
  return {
    exists: true,
    running,
    hostPort: portMatch ? Number.parseInt(portMatch[1], 10) : undefined
  };
}

/** First free port at or after `start`, scanning `start, start+1, ...`. */
async function resolveHostPort(start: number): Promise<number> {
  for (let port = start; port < start + PG_PORT_SCAN; port++) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`No free port in ${start}..${start + PG_PORT_SCAN - 1} for Postgres`);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.listen(port, "127.0.0.1", () => {
      srv.close(() => resolve(true));
    });
  });
}

/** Resolve once the host port accepts a TCP connection, or after a timeout. */
async function waitForPort(port: number, timeoutMs = 30_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(port)) {
      return true;
    }
    await sleep(500);
  }
  return false;
}

function canConnect(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const sock = net.connect({ host: "127.0.0.1", port });
    sock.once("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.once("error", () => resolve(false));
    sock.setTimeout(1000, () => {
      sock.destroy();
      resolve(false);
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Point `DATABASE_URL` at the sandbox on `hostPort`, using the cluster's own
 * credentials (superuser `postgres` with `POSTGRES_PASSWORD`). The database name
 * carries over from any existing URL; the user/password must match the sandbox,
 * not the host's old Postgres, or auth fails with a SASL error.
 */
function applyDatabaseUrl(hostPort: number): void {
  let database = "postgres";
  try {
    if (process.env.DATABASE_URL) {
      const existing = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, "");
      if (existing) {
        database = existing;
      }
    }
  } catch {
    // keep default database name
  }

  const url = new URL(`postgresql://127.0.0.1/${database}`);
  url.username = "postgres";
  url.password = PG_PASSWORD;
  url.port = String(hostPort);
  process.env.DATABASE_URL = url.toString();

  const redacted = new URL(url);
  redacted.password = "***";
  logger.info(`DATABASE_URL -> ${redacted.toString()}`);
}

/**
 * Apply pending Prisma migrations via `prisma migrate deploy`. `DATABASE_URL`
 * is already set on `process.env` and is inherited by the spawned CLI (and wins
 * over prisma.config.ts's dotenv load, which does not override existing vars).
 * Idempotent: a no-op when the cluster is already up to date.
 */
function runMigrations(): void {
  const bin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
  const r = spawnSync(bin, ["migrate", "deploy"], {
    encoding: "utf8",
    env: process.env
  });
  if (r.status === 0) {
    logger.info("Prisma migrations applied");
  } else {
    logger.error("prisma migrate deploy failed:", (r.stderr || r.stdout || "").trim());
  }
}

/** Start (or reuse) a detached PostgreSQL microsandbox. */
export async function startPostgresSandbox(): Promise<void> {
  const state = sandboxState();

  // Reuse a sandbox still running from a previous start; its published port
  // (read from `msb status`) is the source of truth.
  if (state.running && state.hostPort) {
    applyDatabaseUrl(state.hostPort);
    logger.info(
      `Postgres sandbox "${PG_SANDBOX_NAME}" already running on 127.0.0.1:${state.hostPort}; reusing`
    );
    runMigrations();
    return;
  }

  // A stopped/dead sandbox of this name blocks a fresh run; clear it.
  if (state.exists) {
    msb(["remove", PG_SANDBOX_NAME]);
  }

  // Ensure the volume exists; a non-zero exit here just means it already does,
  // which is fine — the run below needs it present, not freshly created.
  msb(["volume", "create", PG_VOLUME_NAME]);

  const hostPort = await resolveHostPort(PG_HOST_PORT);
  if (hostPort !== PG_HOST_PORT) {
    logger.warn(`Port ${PG_HOST_PORT} is occupied; using ${hostPort} instead`);
  }

  const run = msb([
    "run",
    "-d",
    "--name",
    PG_SANDBOX_NAME,
    "-c",
    PG_CPUS,
    "-m",
    PG_MEMORY,
    "--mount-named",
    `${PG_VOLUME_NAME}:${PG_GUEST_MOUNT}`,
    "-e",
    `POSTGRES_PASSWORD=${PG_PASSWORD}`,
    "-p",
    `${hostPort}:${PG_GUEST_PORT}`,
    PG_IMAGE
  ]);
  if (run.status !== 0) {
    throw new Error(`msb run failed: ${run.stderr.trim() || run.stdout.trim()}`);
  }

  applyDatabaseUrl(hostPort);

  if (await waitForPort(hostPort)) {
    logger.info(`${PG_IMAGE} sandbox accepting connections on 127.0.0.1:${hostPort}`);
    runMigrations();
  } else {
    logger.warn(
      `${PG_IMAGE} sandbox started on 127.0.0.1:${hostPort} but is not accepting yet; skipping migrations`
    );
  }
}
