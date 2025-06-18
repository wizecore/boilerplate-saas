import { Task, TaskType } from "@/types";
import { Queue } from "bullmq";

export const connection = {
  url: process.env.REDIS_URL
} as const;

export const queue: Queue<Task, void, TaskType> = new Queue<Task, void, TaskType>("Main", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    }
  }
});
