import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { getPlanLimits, getStripe, getTenantSubscription } from "@/lib/stripe";
import { getUserById } from "@/lib/user";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

export type SubscriptionResponse = Awaited<ReturnType<typeof getTenantSubscription>>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.email) {
    return res.status(400).json({ error: "Email required" });
  }

  const sub = await getTenantSubscription(session.user.tenantId);
  const stripeUserId = sub.stripeUserId;
  const stripeUser = stripeUserId ? await getUserById(stripeUserId) : undefined;
  if (!stripeUser) {
    // Not subscribed
    return res.status(200).json({ ...sub });
  }

  const stripe = await getStripe();
  const customer = await stripe.customers
    .list({
      email: stripeUser?.email,
      limit: 1
    })
    .then(customers => customers.data[0]);

  if (customer) {
    const subscription = await stripe.subscriptions
      .list({
        customer: customer?.id
      })
      .then(subscriptions => subscriptions.data[0]);

    if (subscription) {
      sub.stripePriceId = subscription.items.data[0].price.id;
      sub.planId = subscription.items.data[0].price.lookup_key ?? undefined;
      sub.stripeCustomerId = customer?.id;
      sub.stripeSubscriptionId = subscription.id;

      await prisma.tenant.update({
        where: {
          id: user.tenantId
        },
        data: {
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          ...getPlanLimits(sub.planId)
        }
      });
    } else if (sub.stripeSubscriptionId) {
      logger.warn(
        "Stripe subscription not found for stripeSubscriptionId",
        sub.stripeSubscriptionId
      );
    }
  } else {
    logger.warn("Stripe customer not found for stripeUserId", stripeUserId);
  }

  // logger.info("User", user.id, "Subscription", sub);
  return res.status(200).json({ ...sub });
}
