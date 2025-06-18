import Stripe from "stripe";
import { prisma } from "./db";
import logger from "@/lib/logger";
import { getUserById } from "@/lib/user";

export const getPlanLimits = (_planId?: string | null) => {
  return {};
};

export const getStripe = () => {
  if (!process.env.STRIPE_API_KEY) {
    throw new Error("Missing STRIPE_API_KEY");
  }

  return new Stripe(process.env.STRIPE_API_KEY, {
    apiVersion: "2024-04-10",
    typescript: true
  });
};

export async function getTenantSubscription(tenantId: string) {
  const user = await prisma.tenant.findUniqueOrThrow({
    where: {
      id: tenantId
    },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
      stripeCancelAtPeriodEnd: true,
      stripeUserId: true,
      planId: true
    }
  });

  if (!user) {
    throw new Error("Tenant not found: " + tenantId);
  }

  const subscriber = user.stripeUserId
    ? await prisma.user.findUniqueOrThrow({
        where: {
          id: user.stripeUserId
        }
      })
    : undefined;

  return {
    stripeSubscriptionId: user.stripeSubscriptionId || undefined,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd || undefined,
    stripeCustomerId: user.stripeCustomerId || undefined,
    stripePriceId: user.stripePriceId || undefined,
    stripeCancelAtPeriodEnd: user.stripeCancelAtPeriodEnd || undefined,
    stripeUserId: user.stripeUserId || undefined,
    stripeUserEmail: subscriber?.email || undefined,
    planId: user.planId || undefined
  };
}

/**
 * Update the subscription for a tenant after a successful payment
 *
 * @param sessionId - The Stripe session ID
 * @param userId - The user ID
 * @param tenantId - The tenant ID
 */
export const updateSubscription = async (sessionId: string) => {
  const stripe = await getStripe();
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  const userId = checkoutSession.metadata?.userId;
  const tenantId = checkoutSession.metadata?.tenantId;

  if (!userId || !tenantId) {
    logger.warn("Missing metadata", checkoutSession.metadata);
    throw new Error("Missing metadata in checkout session");
  }

  const user = await getUserById(userId);

  if (!user) {
    logger.warn("User not found", userId);
    throw new Error("User not found from checkout session");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId
    }
  });

  if (!tenant) {
    logger.warn("Tenant not found", tenantId);
    throw new Error("Tenant not found from checkout session");
  }

  if (checkoutSession.payment_status === "paid") {
    const subscription = await stripe.subscriptions.retrieve(
      checkoutSession.subscription as string
    );

    logger.info(
      "Processing checkout session complete",
      sessionId,
      "userId",
      userId,
      "tenantId",
      tenantId,
      "subscription",
      subscription.id
    );

    // If the tenat already has a subscription at stripe, we need to cancel the old one
    const existing = await stripe.subscriptions.list({
      customer: subscription.customer as string,
      status: "active"
    });

    for (const old of existing.data) {
      if (old.id !== subscription.id) {
        logger.info("Cancelling old subscription", old.id, "customer", old.customer);
        await stripe.subscriptions.cancel(old.id);
      }
    }

    await prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        planId: subscription.items.data[0].price.lookup_key,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripeUserId: userId,
        ...getPlanLimits(subscription.items.data[0].price.lookup_key)
      }
    });

    logger.info("Subscription updated successfully", {
      subscriptionId: subscription.id,
      tenantId: tenantId
    });
  } else {
    logger.warn("Subscription update failed", {
      sessionId,
      tenantId,
      checkoutSession
    });
  }
};
