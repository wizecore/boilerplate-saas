import { getCompute } from "@/lib/compute";
import { Limit } from "@/lib/limit";
import logger from "@/lib/logger";
import { TaskTypes } from "@/types";

export const tick = async () => {
  const { prisma, queue } = await getCompute();

  // Once per minute
  const limit = await Limit.minute("queue-tick", 1);
  try {
    const limitResult = await limit(1);
    if (limitResult.granted > 0) {
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
        await queue(task, 60000, true);
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
        await queue(task, 60000, true);
      }
    }
  } catch (error) {
    logger.warn("Tick processing failed", error);
  }
};
