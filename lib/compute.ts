import { Task } from "@/types";
import { prisma } from "@/lib/db";
import { ICache, getCache } from "@/lib/cache";
import { S3Client } from "@aws-sdk/client-s3";
import { queueState } from "@/lib/queue/queueState";
import { queue } from "@/lib/queue";
import { worker } from "@/lib/worker";

interface Compute {
  s3: S3Client;
  prisma: typeof prisma;
  cache: ICache;
  queue: (task: Task, delayMs?: number, skipProcess?: boolean) => Promise<void>;
  tick: () => Promise<void>;
}

export const getCompute = async (): Promise<Compute> => {
  const s3 = new S3Client({
    region: process.env.S3_REGION ?? "",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? ""
    },
    forcePathStyle: true,
    endpoint: process.env.S3_ENDPOINT
  });

  const tick = async () => {
    await worker.isRunning();
    const task = await prisma.task.create({
      data: {
        type: "tick",
        status: "queued"
      }
    });
    await queue.add("tick", task);
  };

  // Always update with new handler, for hot-reloading during dev
  queueState.setHandler(() => tick());

  return {
    s3,
    prisma,
    cache: await getCache(),
    queue: async (task: Task, delayMs?: number) => {
      queue.add(task.type, task, {
        delay: delayMs
      });
    },
    tick
  };
};
