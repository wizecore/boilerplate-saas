import logger from "@/lib/logger";
// eslint-disable-next-line local-rules/disallow-prisma-client-import
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const LOG_THRESHOLD = process.env.PRISMA_LOG_THRESHOLD
  ? parseInt(process.env.PRISMA_LOG_THRESHOLD, 10)
  : 100;

declare global {
  var cachedPrisma: PrismaClient;
}

export let prisma: PrismaClient;

// https://github.com/random42/prisma-extension-log/
export const createPrisma = (): PrismaClient => {
  // Prisma 7 requires a driver adapter; PrismaPg wraps node-postgres (pg).
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({
    adapter,
    log: logger.isVerbose ? [{ emit: "event", level: "query" }] : ["info"]
  });

  prisma.$on("query", e => {
    if (e.duration > 2 && (e.duration > LOG_THRESHOLD || logger.isVerbose)) {
      logger.info(`Query ${e.query} took ${e.duration}ms`);
    }
  });

  return prisma;
};

if (process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    logger.info("Connecting to", process.env.DATABASE_URL);
    prisma = createPrisma();
  } else {
    if (!globalThis.cachedPrisma) {
      logger.info("Connecting to", process.env.DATABASE_URL);
      globalThis.cachedPrisma = createPrisma();
    }
    prisma = globalThis.cachedPrisma;
  }
}
