import logger from "@/lib/logger";
// eslint-disable-next-line local-rules/disallow-prisma-client-import
import { Prisma, PrismaClient } from "@prisma/client";
import { fieldEncryptionExtension } from "prisma-field-encryption";

const LOG_THRESHOLD = 100;

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClientExtended;
}

export let prisma: PrismaClientExtended;

type PrismaClientExtended = PrismaClient;

const prismaExtension = Prisma.defineExtension(client => {
  return client.$extends({
    name: "appTypeEnum",
    result: {}
  });
});

// https://github.com/random42/prisma-extension-log/
const createPrisma = () => {
  const prisma = new PrismaClient({
    log: ["info"]
  });

  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    if (logger.isVerbose) {
      logger.verbose(
        `Query ${params.model}.${params.action}${JSON.stringify(params.args)} took ${
          after - before
        }ms`
      );
    } else if (after - before > LOG_THRESHOLD) {
      logger.info(`Query ${params.model}.${params.action} took ${after - before}ms`);
    }
    return result;
  });

  let extended = prisma.$extends(prismaExtension);
  const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
  if (encryptionKey) {
    extended = extended.$extends(
      fieldEncryptionExtension({
        encryptionKey
      })
    );
  }
  return extended;
};

if (process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    logger.info("Connecting to", process.env.DATABASE_URL);
    prisma = createPrisma() as unknown as PrismaClientExtended;
  } else {
    if (!globalThis.cachedPrisma) {
      logger.info("Connecting to", process.env.DATABASE_URL);
      globalThis.cachedPrisma = createPrisma() as unknown as PrismaClientExtended;
    }
    prisma = globalThis.cachedPrisma;
  }
}
