import type { NextApiRequest, NextApiResponse } from "next";
import logger from "@/lib/logger";
import { Upload } from "@aws-sdk/lib-storage";
import mimeTypes from "mime-types";
import { getServerSession } from "@/lib/middleware";
import { getUserById } from "@/lib/user";
import { getCompute } from "@/lib/compute";
import { formatMessage, str } from "@/lib/utils";
import { CreateBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3";

export const config = {
  api: {
    bodyParser: false
  }
};

const readBody = (req: NextApiRequest): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", chunk => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res);
  if (!session?.user) {
    return res.status(404).json({ error: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    logger.warn("User not found, userId", session.user.id);
    return res.status(404).json({ error: "User not found" });
  }

  const { method } = req;

  if (method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const key = str(req.query.key);
    const originalName = str(req.query.originalName);

    if (!key) {
      return res.status(400).json({ error: "Missing key" });
    }

    if (!originalName) {
      return res.status(400).json({ error: "Missing original name" });
    }

    const contentType = mimeTypes.lookup(key) || "application/octet-stream";
    const body = await readBody(req);
    if (!body || body.length === 0) {
      return res.status(400).json({ error: "Empty file" });
    }

    const bucket = process.env.S3_BUCKET;
    const { s3 } = await getCompute();

    s3.send(new ListBucketsCommand({ Prefix: process.env.S3_BUCKET })).then(result => {
      const bucket = result.Buckets?.find(bucket => bucket.Name === process.env.S3_BUCKET);
      if (!bucket) {
        logger.info("Bucket " + process.env.S3_BUCKET + " does not exist, creating...");
        s3.send(
          new CreateBucketCommand({
            Bucket: process.env.S3_BUCKET
          })
        );
      }
    });

    const result = await new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType || "application/octet-stream",
        Metadata: {
          "original-name": originalName || "",
          "original-userid": session?.user?.id || "",
          "original-size": String(body.length)
        }
      }
    }).done();

    const publicUrl = new URL(`/api/download/${key}`, process.env.NEXT_PUBLIC_APP_URL);
    logger.info("Uploaded", key, "to", publicUrl, "size", body.length, "result", result);
    return res.status(200).json({
      success: true,
      key,
      url: publicUrl
    });
  } catch (e) {
    logger.warn("Failed to handle direct upload", formatMessage(e), "error", e);
    return res.status(500).json({ error: "Failed to upload file" });
  }
}
