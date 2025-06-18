import { batch } from "@/lib/batch";
import { prisma } from "@/lib/db";
import logger, { Logger } from "@/lib/logger";
import { logQueue } from "@/lib/logQueue";
import { Journal, Task } from "@/types";
import { randomUUID } from "crypto";

const ser = (msg: unknown[]) =>
  msg
    .map(m =>
      typeof m === "string" ? m : typeof m === "object" ? JSON.stringify(m, null, 2) : m
    )
    .join(" ");

type SinkRecord = Partial<Omit<Journal, "id">>;

export interface JournalLogger extends Logger {
  flush: () => Promise<number>;
}

const sink = (
  {
    tenantId,
    taskId
  }: {
    tenantId?: string;
    taskId?: string;
    appId?: string;
    hostId?: string;
  },
  fmt?: (rec: SinkRecord) => SinkRecord,
  publishQueue = true,
  systemLog = true
) => {
  const sink: SinkRecord[] = [];
  const fmt0 = <T>(rec: T) => rec;
  const f = (msg: string, level?: "info" | "warn" | "error") => {
    if (systemLog) {
      logger[level ?? "info"](level, msg);
    }
    if (publishQueue && tenantId) {
      logQueue.publish(tenantId, {
        id: randomUUID(),
        type: level ?? "info",
        message: msg,
        createdAt: new Date()
      });
    }
    sink.push(
      (fmt ?? fmt0)({
        type: level ?? "info",
        message: msg,
        tenantId: tenantId,
        taskId: taskId ?? null,
        createdAt: new Date()
      })
    );
  };

  f.flush = async () => {
    if (sink.length === 0) {
      return Promise.resolve(0);
    }

    logger.verbose("Journal flush", sink.length);
    const flush = [...sink];
    sink.splice(0, sink.length);
    await batch(
      flush,
      data =>
        prisma.journal.create({
          data: {
            ...data,
            type: data.type ?? "info",
            message: data.message ?? "",
            tenantId: data.tenantId ?? undefined,
            health: data.health ?? undefined
          }
        }),
      5
    );
    return flush.length;
  };
  f.push = sink.push;
  f.info = (...msg: unknown[]) => f(ser(msg), "info");
  f.warn = (...msg: unknown[]) => f(ser(msg), "warn");
  f.error = (...msg: unknown[]) => f(ser(msg), "error");
  f.isVerbose = logger.isVerbose;
  f.verbose = logger.verbose;
  return f as JournalLogger;
};

/** Collect journal async and ensure it is created by calling journal.flush() */
export const journal = {
  task: (
    task: Pick<Task, "id" | "tenantId"> & { tenantId?: string | null },
    fmt?: (rec: SinkRecord) => SinkRecord,
    publishQueue = true,
    systemLog = true
  ) => {
    return sink(
      {
        tenantId: task.tenantId ?? undefined,
        taskId: task.id
      },
      fmt,
      publishQueue,
      systemLog
    );
  }
};
