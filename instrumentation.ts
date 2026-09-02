import logger from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logger.info("Loaded runtime...");
    // The Postgres microsandbox is a local dev convenience only. `microsandbox`
    // lives in devDependencies and its `msb` binary is absent from a production
    // install, so never import or start it outside development.
    if (process.env.NODE_ENV !== "production") {
      try {
        const { startPostgresSandbox } = await import("@/lib/db/startup");
        await startPostgresSandbox();
      } catch (err) {
        logger.error("Failed to start Postgres sandbox:", err);
      }
    }
  }
}

process.on("SIGINT", () => {
  logger.warn("SIGINT: Shutting down...");
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM: Shutting down...");
});
