import { NextApiResponse } from "next";
import logger from "@/lib/logger";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mimeTypes from "mime-types";
import { toReadableStream } from "@/lib/toReadableStream";
import { Readable } from "stream";

export interface UploadedFile {
  url: string;
  fileName: string;
  size: number;
}

export const downloadPresignedUrl = async (
  s3: S3Client,
  bucket: string,
  key: string,
  download: boolean | undefined,
  fileName: string
) => {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseCacheControl: "public, max-age=604800, immutable",
    ResponseContentDisposition: download
      ? `attachment; filename="${fileName}"`
      : `inline; filename="${fileName}"`
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
  download?: boolean | undefined,
  fileName?: string
) => {
  if (!fileName) {
    fileName = key.split("/").pop();
  } else if (!fileName.includes(".")) {
    const ext = key.split(".").pop() ?? "dat";
    fileName += "." + ext;
  }

  if (!fileName) {
    throw new Error("Missing file name");
  }

  if (process.env.S3_DOWNLOAD_PRESIGNED === "1") {
    const url = await downloadPresignedUrl(s3, bucket, key, download, fileName);
    res.redirect(url);
  } else {
    logger.info("Download", key, "using direct download", download, fileName);
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const result = await s3.send(getObjectCommand);
    const stream = await result.Body?.transformToWebStream().getReader();
    if (!stream) {
      throw new Error("No S3 stream");
    }

    if (download) {
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    }

    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    res.setHeader("Content-Type", mimeTypes.lookup(key) || "application/octet-stream");

    if (result.ContentLength) {
      res.setHeader("Content-Length", result.ContentLength);
    }

    Readable.fromWeb(toReadableStream(stream)).pipe(res);
  }
};
