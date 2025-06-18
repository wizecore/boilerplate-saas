import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import logger from "./logger";
import { randomUUID } from "crypto";
// eslint-disable-next-line local-rules/disallow-prisma-client-import
import { PrismaClient } from "@prisma/client";
import { AdapterUser } from "next-auth/adapters";
import { sendMail } from "@/lib/mail";
import { SignInMail } from "@/lib/mail/signInMail";
import { getAttribution, MinimalApiRequest } from "@/lib/utils";

const authProviders = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
          })
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          Github({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET
          })
        ]
      : []),
    ...(process.env.NODE_ENV === "development" && process.env.NEXTAUTH_CREDENTIALS === "1"
      ? [
          Credentials({
            credentials: {
              username: { label: "Username", type: "text" },
              password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
              const domain = credentials?.username.split("@")[1];
              const domains = [
                "test." + process.env.NEXT_PUBLIC_CREDENTIALS_DOMAIN,
                "test2." + process.env.NEXT_PUBLIC_CREDENTIALS_DOMAIN,
                "test3." + process.env.NEXT_PUBLIC_CREDENTIALS_DOMAIN
              ];

              try {
                if (domain && domains.includes(domain) && credentials?.password === "123") {
                  const now = new Date();
                  const tenant = await prisma.tenant.upsert({
                    where: {
                      name: domain
                    },
                    update: {
                      updatedAt: now
                    },
                    create: {
                      createdAt: now,
                      updatedAt: now,
                      name: domain
                    }
                  });

                  const user = await prisma.user.upsert({
                    where: {
                      email: credentials.username
                    },
                    update: {
                      flags: {
                        set: ["test", "tracking-"]
                      }
                    },
                    create: {
                      createdAt: now,
                      updatedAt: now,
                      emailVerified: now,
                      lastLoginAt: now,
                      email: credentials.username,
                      name: "Test User",
                      tenantId: tenant.id,
                      flags: ["test", "tracking-"]
                    }
                  });
                  return user;
                } else {
                  return null;
                }
              } catch (error) {
                logger.warn("Error authorizing user", error);
                throw new Error("Sign in error");
              }
            }
          })
        ]
      : []),
    ...(process.env.NEXTAUTH_EMAIL === "1"
      ? [
          Email({
            sendVerificationRequest: async ({
              identifier: email,
              url,
              provider: _provider
            }) => {
              const user = await prisma.user.findUnique({
                where: {
                  email
                },
                select: {
                  name: true,
                  emailVerified: true,
                  id: true
                }
              });

              const signIn = user?.emailVerified ? true : false;
              const authSubject = signIn
                ? "Sign in link for " + process.env.NEXT_PUBLIC_APP_NAME
                : "Activate your " + process.env.NEXT_PUBLIC_APP_NAME + " account";

              try {
                const result = await sendMail(
                  email,
                  authSubject,
                  <SignInMail signIn={signIn} url={url} />,
                  {
                    referenceId: user?.id ?? email,
                    plainText: true,
                    darkModeForce: true
                  }
                );

                logger.info("Email sent", result);
              } catch (error) {
                logger.warn("Failed to send verification email.", error);
                throw new Error("Failed to send verification email.");
              }
            }
          })
        ]
      : [])
  ]
} satisfies NextAuthOptions;

export const authOptions: (req: MinimalApiRequest) => NextAuthOptions = req => ({
  adapter: {
    // FIXME: we override type of PrismaClient, but we don't touch account, users, etc tables
    ...PrismaAdapter(prisma as unknown as PrismaClient),
    createUser: async (profile: Omit<AdapterUser, "id">) => {
      const now = new Date();
      const tenant = await prisma.tenant.create({
        data: {
          name: randomUUID(),
          createdAt: now,
          updatedAt: now
        }
      });

      const user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name ?? "Unnamed user",
          image: profile.image,
          emailVerified: now,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          tenantId: tenant.id
        }
      });

      const attribution = getAttribution(req);
      logger.info("User", user.id, "email", user.email, req.query, "attribution", attribution);
      if (attribution) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            attributes: {
              ...attribution,
              attributedAt: new Date()
            }
          }
        });
      }
      return user;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // Every 90 days
    updateAge: 1 * 60 * 60 // Every hour
  },
  pages: {
    signIn: "/auth/signIn",
    error: "/auth/error",
    verifyRequest: "/auth/checkEmail"
  },
  callbacks: {
    async session({ token, session }) {
      if (!token.sub) {
        throw new Error("No sub");
      }
      session.user.id = token.sub;
      session.user.tenantId = token.tenantId;
      // logger.verbose("session", session.user);
      return session;
    },

    async signIn({ user, account }) {
      if (!user.email) {
        throw new Error("No email");
      }

      logger.info(
        "User",
        user.id,
        "email",
        user.email,
        "account",
        account?.providerAccountId,
        "provider",
        account?.provider
      );
      const exitingUser = await prisma.user.findUnique({
        where: {
          email: user.email
        }
      });

      if (exitingUser) {
        const tenant = await prisma.tenant.findUnique({
          where: {
            id: exitingUser?.tenantId
          },
          select: {
            id: true,
            status: true
          }
        });

        if (!tenant) {
          logger.warn("Tenant not found", exitingUser?.tenantId, "for user", user.email);
          throw new Error("Tenant not found");
        }

        logger.info("Tenant", tenant.id, "status", tenant.status);
        if (tenant?.status !== "active") {
          throw new Error("Tenant is not active");
        }
        const existingAccount = await prisma.account.findFirst({
          where: {
            userId: exitingUser.id
          }
        });

        if (existingAccount && existingAccount.provider !== account?.provider) {
          logger.warn(
            "User",
            user.email,
            "has an account with another provider",
            existingAccount.provider,
            "new provider",
            account?.provider
          );

          await prisma.account.update({
            where: {
              id: existingAccount.id
            },
            data: {
              provider: account?.provider,
              type: account?.type,
              providerAccountId: account?.providerAccountId,
              access_token: account?.access_token,
              refresh_token: account?.refresh_token,
              expires_at: account?.expires_at,
              token_type: account?.token_type,
              scope: account?.scope,
              id_token: account?.id_token
            }
          });
        }

        await prisma.user.update({
          where: {
            id: exitingUser.id
          },
          data: {
            lastLoginAt: new Date()
          }
        });

        const attribution = getAttribution(req);
        logger.info(
          "User",
          user.id,
          "email",
          user.email,
          req.query,
          "attribution",
          attribution
        );
        if (attribution) {
          await prisma.user.update({
            where: { id: exitingUser.id },
            data: {
              attributes: {
                ...attribution,
                attributedAt: new Date()
              }
            }
          });
        }
      }

      return true;
    },

    async jwt({ token, trigger }) {
      // logger.verbose("jwt", trigger, token);
      if (trigger === "signIn" || trigger === "signUp") {
        if (!token.sub) {
          throw new Error("No sub");
        }

        const user = await prisma.user.findUniqueOrThrow({
          where: {
            id: token.sub
          }
        });

        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.tenantId = user.tenantId;
        return token;
      } else {
        return token;
      }
    }
  },
  ...authProviders,
  debug: process.env.NODE_ENV !== "production"
});
