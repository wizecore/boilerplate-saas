import { spawn } from "child_process";
import systemLogger, { MinimalLogger } from "@/lib/logger";

export const runCommand = (
  cmd: string,
  args: string[],
  env: Record<string, string>,
  logger?: MinimalLogger
) =>
  new Promise<void>((resolve, reject) => {
    const childProcess = spawn(cmd, args, {
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "production",
        ...env
      }
    });
    childProcess.stdout.on("data", data => {
      (logger ?? systemLogger).info(data.toString());
    });
    childProcess.stderr.on("data", data => {
      (logger ?? systemLogger).warn(data.toString());
    });
    childProcess.on("error", error => {
      reject(error);
    });
    childProcess.on("exit", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}.`));
      }
    });
  });
