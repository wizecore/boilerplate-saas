import { User } from "next-auth";

type UserId = string;

export type NextAuthSessionUser = User & {
  id: UserId;
  tenantId: string;
  email: string;
};

declare module "next-auth/jwt" {
  interface JWT {
    id: UserId;
    tenantId: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: NextAuthSessionUser;
  }

  interface DefaultUser {
    email: string;
  }
}
