import { authOptions } from "@/lib/auth";
import { MinimalApiRequest } from "@/lib/utils";
import { NextAuthSessionUser } from "@/types/next-auth";
import { NextApiRequest } from "next";
import { getServerSession as getNextjsServerSession, Session } from "next-auth";
import { ServerResponse } from "node:http";

export interface NextApiRequestWithUser extends NextApiRequest {
  user?: NextAuthSessionUser;
}

export type ServerSession = Omit<Session, "expires">;

/**
 * Resolves the authenticated session for an API route.
 *
 * Wraps NextAuth's getServerSession with the app's authOptions, so routes can
 * simply call getServerSession(req, res) without repeating the options. The
 * resolved user is cached on the request to avoid re-decoding the session when
 * a route (or getServerSideProps) asks for it more than once.
 *
 * Returns undefined when the request is unauthenticated — the caller decides
 * how to respond (typically a 401/404 JSON body).
 */
export const getServerSession = async (
  req: MinimalApiRequest,
  res: ServerResponse
): Promise<ServerSession | undefined> => {
  const authorized = (req as NextApiRequestWithUser).user;
  if (authorized) {
    return {
      user: authorized
    };
  }

  const session =
    (await getNextjsServerSession(req as NextApiRequest, res, authOptions(req))) ?? undefined;

  if (!session) {
    return undefined;
  }

  (req as NextApiRequestWithUser).user = session.user;

  return {
    user: session.user
  };
};
