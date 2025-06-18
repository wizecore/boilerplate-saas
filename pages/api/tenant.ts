import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { getTenantById, getUserById } from "@/lib/user";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

export type UserResponse = Awaited<ReturnType<typeof getUserById>>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    logger.warn("User not found", session.user.id);
    return res.status(404).json({ error: "User not found" });
  }

  const tenant = await getTenantById(user.tenantId);
  if (!tenant) {
    logger.warn("Tenant not found", user.tenantId);
    return res.status(404).json({ error: "Tenant not found" });
  }

  return res.status(200).json({ ...tenant });
}
