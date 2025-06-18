import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { omit } from "@/lib/utils";
import { Tenant, User } from "@/types";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      },
      select: {
        name: true,
        email: true,
        id: true
      }
    });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (
  id: string
): Promise<Pick<User, "name" | "email" | "id" | "tenantId" | "image" | "flags"> | null> => {
  const user = await prisma.user.findFirst({
    where: { id },
    select: {
      name: true,
      email: true,
      image: true,
      id: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          status: true
        }
      },
      flags: true
    }
  });

  if (user && !user.tenant) {
    logger.warn("User", user.id, user.email, "has no tenant");
    return null;
  }

  if (user && user.tenant && user.tenant.status != "active") {
    logger.warn(
      "User",
      user.id,
      user.email,
      "tenantId",
      user.tenant.id,
      "is not active: " + user.tenant.status
    );
    return null;
  }

  return user ? omit(user, "tenant") : null;
};

export const getTenantById = async (
  id: string
): Promise<Pick<Tenant, "id" | "name" | "planId"> | null> => {
  return await prisma.tenant.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      planId: true
    }
  });
};
