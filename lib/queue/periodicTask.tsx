import { Task } from "@/types";
import { journal } from "@/lib/journal";
import { MinimalLogger } from "@/lib/logger";
import { getCompute } from "@/lib/compute";
import { formatDuration, intervalToDuration } from "date-fns";
import { Limit } from "@/lib/limit";
import systemLogger from "@/lib/logger";

/* Interval in milliseconds */
export const periodicTaskInterval: Record<
  "period:day" | "period:week" | "period:hour" | "period:minute" | "period:month",
  number
> = {
  "period:day": 24 * 60 * 60 * 1000,
  "period:week": 7 * 24 * 60 * 60 * 1000,
  "period:hour": 60 * 60 * 1000,
  "period:minute": 60 * 1000,
  // FIXME: should be adjustable for a specific 1st of the month
  "period:month": 30 * 24 * 60 * 60 * 1000
};

/**
 * Computes the delay for re-scheduling a periodic task, anchored to the
 * previous scheduled time (`nextExecuteAt`) to prevent drift. When the task is
 * overdue (or has never run) the next run is scheduled one interval from now.
 */
export const getNextDelay = (
  nextExecuteAt: Date | null | undefined,
  interval: number,
  now: number = Date.now()
): number => {
  const anchor = nextExecuteAt?.getTime() ?? now;
  const nextTarget = anchor + interval;
  return Math.max(nextTarget - now, 0) || interval;
};

export const periodicTask = async (task: Task, providedLogger?: MinimalLogger) => {
  const { prisma } = await getCompute();
  const journalled = providedLogger ? undefined : journal.task(task);
  const logger = providedLogger ? providedLogger : journalled!;
  try {
    const limit = await Limit.minute(task.type + "-" + task.tenantId, 1);
    const limitResult = await limit(1);
    if (limitResult.granted === 0) {
      logger.info("Skipping task", task.id, "already executing now");
      return { skipped: true, error: "Already executing" };
    }

    if (!task.tenantId) {
      logger.info("Skipping task", task.id, "no tenantId");
      return { skipped: true, error: "No tenantId" };
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        id: task.tenantId
      }
    });

    if (tenant?.status !== "active") {
      logger.info(
        "Skipping task",
        task.id,
        "tenant is not active",
        task.tenantId,
        "status",
        tenant?.status
      );
      return { skipped: true, error: "Tenant is not active" };
    }

    const executedAt = task.executedAt;
    const result: Record<string, unknown> = {};

    systemLogger.info(
      "Executing",
      task.type,
      "for tenantId",
      task.tenantId,
      "taskId",
      task.id,
      "since execution",
      executedAt
        ? formatDuration(intervalToDuration({ start: executedAt, end: new Date() }))
        : "infinity"
    );

    if (task.type === "period:hour") {
      // Delete all older than 30 days logs
      const deleted = await prisma.journal.deleteMany({
        where: {
          tenantId: task.tenantId,
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      if (deleted.count > 0) {
        systemLogger.info("Deleted", deleted.count, "log records for tenant", task.tenantId);
        result["journalDeleted"] = deleted.count;
      }
    }

    return { ...result };
  } finally {
    if (journalled) {
      await journalled.flush();
    }
  }
};
