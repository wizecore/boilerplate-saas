import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { getUserById } from "@/lib/user";
import { getCompute } from "@/lib/compute";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== "string" || !id?.trim()) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "POST":
      const body = req.body as { force?: boolean };
      try {
        const task = await prisma.task.findUnique({
          where: { id, tenantId: user.tenantId }
        });

        if (!task) {
          logger.warn(`Task ${id} not found`);
          return res.status(404).json({ message: "Task not found" });
        }

        if (!task.status || task.status === "error" || body?.force) {
          const { queue } = await getCompute();
          await queue(task);
        } else {
          logger.warn(`Task ${task.id} in a wrong state: ${task.status}`);
          return res.status(200).json(task);
        }

        res.status(200).json(task);
      } catch (error) {
        logger.warn(error);
        res.status(500).json({ message: "Error fetching task", error });
      }
      break;

    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
