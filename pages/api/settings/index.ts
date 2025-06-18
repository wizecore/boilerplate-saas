import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pick } from "@/lib/utils";
import logger from "@/lib/logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["GET", "PATCH"].includes(req.method!)) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      logger.warn("User not found, userId", session.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    if (req.method === "GET") {
      res.status(200).json(pick(user, "id", "name", "email", "image"));
    } else if (req.method === "PATCH") {
      const { name, image } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { name, image }
      });

      res.status(200).json(pick(updatedUser, "id", "name", "email", "image"));
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings", error });
  }
}
