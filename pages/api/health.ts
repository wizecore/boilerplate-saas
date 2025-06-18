import { NextApiRequest, NextApiResponse } from "next";

import { ListObjectsCommand } from "@aws-sdk/client-s3";

import { getCompute } from "@/lib/compute";
import logger from "@/lib/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response: Record<string, unknown> = {};
  const { s3, prisma, cache } = await getCompute();

  // List objects
  try {
    const start = Date.now();
    const getObjectCommand = new ListObjectsCommand({
      Bucket: process.env.S3_BUCKET,
      Prefix: String(Date.now()) // Something non-existing
    });
    const getRes = await s3.send(getObjectCommand);
    response["s3"] = !!getRes;
    response["s3elapsed"] = Date.now() - start;
  } catch (error) {
    logger.warn("S3", error);
    response["s3"] = false;
  }

  const start2 = Date.now();
  try {
    await fetch("https://checkip.amazonaws.com/")
      .then(res => res.text())
      .then(text => {
        response["ip"] = !!text?.trim();
        response["ipelapsed"] = Date.now() - start2;
      });
  } catch (error) {
    logger.warn("IP", error);
    response["ip"] = false;
  }

  // Check database
  try {
    const start4 = Date.now();
    await prisma.user.findMany().then(users => {
      response["db"] = !!users.length;
      response["dbelapsed"] = Date.now() - start4;
    });
  } catch (error) {
    logger.warn("DB", error);
    response["db"] = false;
  }

  // Check cache
  try {
    const start5 = Date.now();
    const key = "health" + start5;
    await cache.set(key, "1", 3000);
    response["cache"] = !!(await cache.get(key));
    response["cacheelapsed"] = Date.now() - start5;
    await cache.set(key, null);
  } catch (error) {
    logger.warn("Cache", error);
    response["cache"] = false;
  }

  return res.status(200).json({ ...response });
}
