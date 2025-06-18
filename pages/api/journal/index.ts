import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Journal, Task, TaskTypeCheck } from "@/types";
import logger from "@/lib/logger";

export type ListJournalResponse = Journal & {
  task?: Pick<Task, "id" | "type" | "status"> | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListJournalResponse[] | { message: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const taskType = req.query.taskType as string;
    const taskId = req.query.taskId as string;
    const logs = (await prisma.journal.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(taskType && taskType !== "all"
          ? {
              task: {
                type: TaskTypeCheck.parse(taskType)
              }
            }
          : {}),
        ...(taskId ? { taskId } : {}),
        AND: [
          {
            NOT: { type: "health" }
          }
        ]
      },
      include: {
        task: {
          select: {
            id: true,
            type: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: limit ? (page - 1) * limit : undefined
    })) as ListJournalResponse[];

    res.status(200).json(logs);
  } catch (error) {
    logger.warn("Error fetching tasks", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
}
