import { NextApiRequest, NextApiResponse } from "next";
import { getCompute } from "@/lib/compute";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tick } = await getCompute();
  await tick();
  return res.status(200).json({});
}
