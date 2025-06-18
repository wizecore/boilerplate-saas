import fs from "node:fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "node:path/posix";
import logger from "@/lib/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  logger.info(`Reading changelog from ${filePath}`);
  const markdown = fs.readFileSync(filePath, "utf8");
  return res.status(200).json({
    build: process.env.BUILD_ID,
    git: process.env.GIT_TAGS,
    gitCommit: process.env.GIT_COMMIT,
    gitBranch: process.env.GIT_BRANCH,
    changes: markdown
  });
}
