import { getServerSession } from "@/lib/middleware";
import { getTenantSubscription } from "@/lib/stripe";
import { NextApiRequest, NextApiResponse } from "next";

export type SubscriptionResponse = Awaited<ReturnType<typeof getTenantSubscription>>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sub = await getTenantSubscription(session.user.tenantId);
  return res.status(200).json({ ...sub });
}
