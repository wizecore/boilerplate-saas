import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";
import { getUserById } from "@/lib/user";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

export type UserResponse = Awaited<ReturnType<typeof getUserById>>;

/**
 * We are intentionally returning 404 if the user is not found,
 * because at the frontend we usually react on the response code to show global error message.
 *
 * But this endpoint can be consumed by the frontend
 * using `useSWR("/api/user", fetcherIgnore404)`
 * to ignore 404 and return null instead.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(404).json({ error: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    logger.warn("User not found, userId", session.user.id);
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({ ...user });
}
