import type { NextApiRequest, NextApiResponse } from "next";
import { getCompute } from "@/lib/compute";
import { download } from "@/lib/upload";
import logger from "@/lib/logger";
import { str } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = req.query.key;
  const fileName = str(req.query.fileName);
  const path = typeof key === "string" ? key : Array.isArray(key) ? key.join("/") : undefined;
  if (!path) {
    return res.status(400).json({ error: "Missing or invalid key parameter" });
  }

  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return res.status(500).json({ error: "S3_BUCKET not configured" });
  }

  try {
    const { s3 } = await getCompute();
    await download(s3, bucket, path, res, undefined, fileName);
  } catch (error) {
    logger.error("Download failed", error);
    return res.status(500).json({ error: "Download failed" });
  }
}
