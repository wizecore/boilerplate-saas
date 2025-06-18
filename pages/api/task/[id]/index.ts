import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== "string" || !id?.trim()) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        const task = await prisma.task.findUnique({
          where: { id, tenantId: session.user.tenantId }
        });
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        res.status(200).json(task);
      } catch (error) {
        logger.warn(error);
        res.status(500).json({ message: "Error fetching task", error });
      }
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
