import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { TaskType, TaskTypes } from "@/types";
import { getCompute } from "@/lib/compute";
import { periodicTaskInterval } from "@/lib/queue/periodicTask";
import { getUserById } from "@/lib/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { queue } = await getCompute();

  if (!["GET", "PATCH", "POST"].includes(req.method!)) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await getUserById(session.user.id);

    if (!user) {
      logger.warn("User not found, userId", session.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    });

    if (!tenant) {
      logger.warn("Tenant not found, tenantId", user.tenantId);
      return res.status(404).json({ message: "Tenant not found" });
    }

    const type = req.query.type;
    const taskType = ("period:" + type) as TaskType;
    if (!(TaskTypes as string[]).includes("period:" + type)) {
      logger.warn("Invalid type", type);
      return res.status(400).json({ message: "Invalid type" });
    }

    if (req.method === "GET") {
      const existing = await prisma.task.findFirst({
        where: {
          tenantId: user.tenantId,
          type: taskType
        }
      });

      logger.info("Existing period task", existing?.id, "tenantId", user.tenantId);
      return res.status(200).json({
        enabled: !!existing,
        status: existing?.status,
        executedAt: existing?.executedAt,
        nextExecuteAt: existing?.nextExecuteAt,
        result: existing?.result
      });
    } else if (req.method === "PATCH") {
      const { enabled } = req.body as { enabled?: boolean };

      if (enabled === true) {
        logger.info("Enabling period task", taskType, "tenantId", user.tenantId);
        const deleted = await prisma.task.deleteMany({
          where: {
            tenantId: user.tenantId,
            type: taskType
          }
        });

        logger.info("Deleted previous period tasks", deleted.count);

        const created = await prisma.task.create({
          data: {
            userId: user.id,
            tenantId: user.tenantId,
            type: taskType,
            status: "queued",
            interval: periodicTaskInterval[taskType as keyof typeof periodicTaskInterval]
          }
        });

        logger.info("Created new period task", created?.id);
        await queue(created, 60000, true);
        return res.status(200).json({ message: "Task created" });
      } else {
        logger.info("Disabling period task", taskType, "tenantId", user.tenantId);
        const deleted = await prisma.task.deleteMany({
          where: {
            tenantId: user.tenantId,
            type: taskType
          }
        });

        logger.info(
          "Deleted period task",
          taskType,
          "tenantId",
          user.tenantId,
          "count",
          deleted.count
        );
        return res.status(200).json({ message: "Task deleted" });
      }
    } else if (req.method === "POST") {
      const { force } = req.body as { force?: boolean };
      if (force) {
        logger.info("Executing period task", taskType, "tenantId", user.tenantId);

        const existing = await prisma.task.findFirst({
          where: {
            tenantId: user.tenantId,
            type: taskType
          }
        });

        if (!existing) {
          logger.info("Task does not exist, tenantId", user.tenantId, "taskType", taskType);
          return res.status(404).json({ message: "Task does not exist" });
        } else {
          logger.info("Task found, tenantId", user.tenantId, "taskType", taskType);
          await queue(existing);
          return res.status(200).json({ message: "Task queued" });
        }
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings", error });
  }
}
