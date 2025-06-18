import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Journal, Task } from "@/types";
import logger from "@/lib/logger";
import { int, str } from "@/lib/utils";

export type LatestJournalResponse = Journal & {
  task?: Pick<Task, "id" | "type" | "status"> | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LatestJournalResponse[] | { message: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const limit = int(req.query.limit) ?? 10;
    const taskId = str(req.query.taskId);
    const logs = (await prisma.journal.findMany({
      // Don't show access logs
      where: {
        tenantId: session.user.tenantId,
        taskId,
        AND: [{ type: { not: "log" } }, { path: null }, { type: { not: "health" } }]
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit
    })) as LatestJournalResponse[];

    res.status(200).json(logs);
  } catch (error) {
    logger.warn("Error fetching tasks", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
}
