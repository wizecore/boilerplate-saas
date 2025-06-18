import { NextApiResponse } from "next";
import logger from "@/lib/logger";
import { getCompute } from "@/lib/compute";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { toReadableStream } from "@/lib/toReadableStream";
import { Readable } from "stream";

export const upload = async (prefix: "build" | "backup", fileName: string, body: Readable) => {
  const { s3 } = await getCompute();
  const now = new Date();
  const key =
    prefix +
    "/" +
    new Date().getFullYear() +
    "/" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(now.getDate()).padStart(2, "0") +
    "/" +
    fileName;

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: body
  });

  logger.info("Uploading to S3", key);
  await s3.send(putObjectCommand);
  return key;
};

export const downloadPresignedUrl = async (
  s3: S3Client,
  bucket: string,
  key: string,
  fileName: string
) => {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`
  });

  const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
  logger.info("Download", key, "using signed url", url);
  return url;
};

export const download = async (
  s3: S3Client,
  bucket: string,
  key: string,
  res: NextApiResponse,
  fileName?: string
) => {
  const ext = key.endsWith(".zip")
    ? "zip"
    : key.endsWith(".tar.gz")
      ? "tar.gz"
      : key.endsWith(".tgz")
        ? "tgz"
        : key.endsWith(".tar.bz2")
          ? "tar.bz2"
          : key.endsWith(".tar.xz")
            ? "tar.xz"
            : key.endsWith(".tar")
              ? "tar"
              : key.endsWith(".sql.gz")
                ? "sql.gz"
                : key.endsWith(".gz")
                  ? "gz"
                  : "dat";

  if (!fileName) {
    fileName = key.split("/").pop() ?? key;
  } else {
    fileName += "." + ext;
  }

  if (process.env.S3_DOWNLOAD_PRESIGNED === "1") {
    const url = await downloadPresignedUrl(s3, bucket, key, fileName);
    res.redirect(url);
  } else {
    logger.info("Download", key, "using direct download");
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const result = await s3.send(getObjectCommand);
    const stream = await result.Body?.transformToWebStream().getReader();
    if (!stream) {
      throw new Error("No S3 stream");
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/zip");
    if (result.ContentLength) {
      res.setHeader("Content-Length", result.ContentLength);
    }
    Readable.fromWeb(toReadableStream(stream)).pipe(res);
  }
};
