import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";
import { NextApiRequest, NextApiResponse } from "next/types";

const authHandler = (req: NextApiRequest, resp: NextApiResponse) =>
  NextAuth(req, resp, authOptions(req));

export default authHandler;
