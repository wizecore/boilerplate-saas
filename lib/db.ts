import logger from "@/lib/logger";
// eslint-disable-next-line local-rules/disallow-prisma-client-import
import { PrismaClient } from "@prisma/client";
import { fieldEncryptionExtension } from "prisma-field-encryption";

const LOG_THRESHOLD = process.env.PRISMA_LOG_THRESHOLD
  ? parseInt(process.env.PRISMA_LOG_THRESHOLD, 10)
  : 100;

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}

export let prisma: PrismaClient;

// https://github.com/random42/prisma-extension-log/
export const createPrisma = (): PrismaClient => {
  const prisma = new PrismaClient({
    log: logger.isVerbose ? [{ emit: "event", level: "query" }] : ["info"]
  });

  prisma.$on("query", e => {
    if (e.duration > 2 && (e.duration > LOG_THRESHOLD || logger.isVerbose)) {
      logger.info(`Query ${e.query} took ${e.duration}ms`);
    }
  });

  const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
  if (encryptionKey) {
    return prisma.$extends(
      fieldEncryptionExtension({
        encryptionKey
      })
    ) as unknown as PrismaClient;
  }

  return prisma;
};

if (process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    logger.info("Connecting to", process.env.DATABASE_URL);
    prisma = createPrisma() as unknown as PrismaClient;
  } else {
    if (!globalThis.cachedPrisma) {
      logger.info("Connecting to", process.env.DATABASE_URL);
      globalThis.cachedPrisma = createPrisma();
    }
    prisma = globalThis.cachedPrisma;
  }
}
