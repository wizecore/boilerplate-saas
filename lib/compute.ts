import { Task } from "@/types";
import { prisma } from "@/lib/db";
import { getCache } from "@/lib/cache";
import { S3Client } from "@aws-sdk/client-s3";
import { queueState } from "@/lib/queue/queueState";
import { queue } from "@/lib/queue";
import { tick } from "./queue/tick";

export const getCompute = async () => {
  const s3 = new S3Client({
    region: process.env.S3_REGION ?? "",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? ""
    },
    forcePathStyle: true,
    endpoint: process.env.S3_ENDPOINT
  });

  // Always update with new handler, for hot-reloading during dev
  queueState.setHandler(() => tick());

  return {
    s3,
    prisma,
    cache: await getCache(),
    queue: async (task: Task, delayMs?: number) => {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "queued",
          executing: false,
          executionStartedAt: null,
          nextExecuteAt: delayMs ? new Date(Date.now() + delayMs) : undefined
        }
      });

      await queue.add(task.type, task, {
        delay: delayMs
      });
    },
    tick
  };
};
