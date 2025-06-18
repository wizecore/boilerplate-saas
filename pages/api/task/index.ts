import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Task, TaskStatus } from "@/types";
import logger from "@/lib/logger";
import { whereField } from "@/lib/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Task[] | { message: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { status } = req.query as { status: TaskStatus };
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const tasks = await prisma.task.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...whereField("status", status)
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: limit ? (page - 1) * limit : undefined
    });

    res.status(200).json(tasks as Task[]);
  } catch (error) {
    logger.warn("Error fetching tasks", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
}
