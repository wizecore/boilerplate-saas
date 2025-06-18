import { Job, Worker } from "bullmq";
import { queue, connection } from "./queue";
import logger from "@/lib/logger";
import { Task, TaskType } from "@/types";
import { getCompute } from "@/lib/compute";

/** Remove previous instances of workers */
const context = globalThis as { __workers?: WeakRef<Worker>[] };
context.__workers = context.__workers || [];
context.__workers.splice(0).forEach(workerRef => {
  const worker = workerRef.deref();
  if (worker) {
    logger.info("Closing stale worker", worker.opts?.name ?? worker.name);
    worker.close();
  }
});

const trace = (worker: Worker, verbose?: boolean) => {
  const log = verbose ? logger.info : () => {};
  worker.on("ready", () => {
    log("Worker", worker.opts?.name ?? worker.name, "ready");
  });
  worker.on("completed", job => {
    log("Worker", worker.opts?.name ?? worker.name, "job", job.id, "completed");
  });
  worker.on("failed", (job, err) => {
    log("Worker", worker.opts?.name ?? worker.name, "job", job?.id, "failed", err);
  });
  worker.on("error", err => {
    log("Worker", worker.opts?.name ?? worker.name, "error", err);
  });
  worker.on("stalled", jobId => {
    log("Worker", worker.opts?.name ?? worker.name, "job", jobId, "stalled");
  });
  worker.on("active", job => {
    log("Worker", worker.opts?.name ?? worker.name, "job", job.id, "active");
  });
  worker.on("paused", () => {
    log("Worker", worker.opts?.name ?? worker.name, "paused");
  });
  worker.on("drained", () => {
    log("Worker", worker.name, "drained");
  });
  return worker;
};

const processor = async (
  worker: Worker<Task, void, string>,
  job: Job<Task, void, TaskType>,
  token?: string
) => {
  logger.verbose(worker.opts.name, "Got job", job.name, "token", token);
  const { prisma } = await getCompute();
  const task = await prisma.task.findUniqueOrThrow({
    where: {
      id: job.data.id
    }
  });

  if (task.status !== "queued") {
    logger.info(worker.opts.name, "Task", task.id, "is not queued, skipping");
    return;
  }

  await prisma.task.update({
    where: {
      id: task.id
    },
    data: {
      status: "active",
      executionStartedAt: new Date()
    }
  });

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    await prisma.task.update({
      where: {
        id: task.id
      },
      data: {
        status: "completed",
        executedAt: new Date()
      }
    });
  } catch (err) {
    await prisma.task.update({
      where: {
        id: task.id
      },
      data: {
        status: "error",
        result: {
          error: err instanceof Error ? err.message : String(err)
        }
      }
    });
  }
};

export const worker = trace(
  // FIXME: BullMQ bug: Why NameType is not restricted to TaskType?
  new Worker<Task, void, string>(
    queue.name,
    // FIXME: Why I need to force types
    (job, token) => processor(worker, job as Job<Task, void, TaskType>, token),
    {
      connection,
      name: "worker-" + new Date().toISOString()
    }
  ),
  process.env.NEXT_PUBLIC_LOG_VERBOSE === "1"
);

logger.info("Worker", worker.opts?.name ?? name, "started");
context.__workers.push(new WeakRef(worker));

const time = performance.now();
const collect = new FinalizationRegistry((value: { time: number }) => {
  logger.info(
    "The object " +
      value +
      " was just finalized. Live time: " +
      (performance.now() - value.time).toFixed()
  );
});

collect.register(worker, { time });
