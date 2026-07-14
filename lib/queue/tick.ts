import { getCompute } from "@/lib/compute";
import { Limit } from "@/lib/limit";
import logger from "@/lib/logger";
import { TaskTypes } from "@/types";
import { worker } from "../worker";

/** Cleanup and maintenance tick */
export const tick = async () => {
  // DO NOT REMOVE THIS, it's used to ensure that the worker is running.
  await worker.isRunning();
  const { prisma, queue } = await getCompute();

  // Once per minute
  const limit = await Limit.minute("queue-tick", 1);
  try {
    const limitResult = await limit(1);
    // Limit.minute grants 1 to the first caller within the minute; only the
    // caller that wins that slot should run the sweep (mirrors the guard in
    // periodicTask). Bail out otherwise.
    if (!limitResult.granted) {
      return;
    }

    const failed = await prisma.task.findMany({
      where: {
        status: "error",
        type: {
          in: TaskTypes.filter(t => t.startsWith("period:"))
        }
      }
    });

    if (failed.length > 0) {
      logger.info(`Found ${failed.length} failed periodic tasks`);

      for (const task of failed) {
        logger.info(`Requeueing failed periodic task ${task.id}`);
        await queue(task, 60000);
      }
    }

    const missedInterval = await prisma.task.findMany({
      where: {
        status: "queued",
        type: {
          in: TaskTypes.filter(t => t.startsWith("period:"))
        },
        nextExecuteAt: {
          // Allow 2 minutes for the task to be processed
          lt: new Date(Date.now() - 120000)
        }
      }
    });

    if (missedInterval.length > 0) {
      logger.info(`Found ${missedInterval.length} missed interval tasks`);

      for (const task of missedInterval) {
        logger.info(
          `Requeueing missed interval task ${task.id}, type`,
          task.type,
          "tenantId",
          task.tenantId
        );
        await queue(task, 60000);
      }
    }
  } catch (error) {
    logger.warn("Tick processing failed", error);
  }
};
