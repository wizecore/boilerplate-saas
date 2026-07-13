import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { fromSubscription, getPlanLimits, getStripe, updateSubscription } from "@/lib/stripe";
import logger from "@/lib/logger";
import { buffer } from "stream/consumers";

/** @type {import("next").PageConfig} */
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = await buffer(req);
  const signature = req.headers["stripe-signature"] as string;
  const stripe = getStripe();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn("Missing STRIPE_WEBHOOK_SECRET");
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  if (req.method === "GET" && !signature) {
    return res.status(200).send({ status: "ok" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info("Processing webhook event", event.type);

    if (event.type === "checkout.session.completed") {
      // Retrieve the subscription details from Stripe.
      const session = event.data.object as Stripe.Checkout.Session;
      await updateSubscription(session.id);
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = await stripe.subscriptions.retrieve(
        invoice.lines.data[0].subscription as string
      );
      const userId = subscription.metadata?.userId;
      const tenantId = subscription.metadata?.tenantId;
      if (!userId || !tenantId) {
        logger.warn(event.type, "Missing metadata", invoice.metadata);
        return res.status(400).send("Missing metadata");
      }

      logger.info(
        "Processing invoice payment, userId",
        userId,
        "tenantId",
        tenantId,
        "subscription",
        subscription.id
      );
      await prisma.tenant.update({
        where: {
          id: tenantId
        },
        data: {
          planId: subscription.items.data[0].price.lookup_key,
          ...fromSubscription(subscription),
          ...getPlanLimits(subscription.items.data[0].price.lookup_key)
        }
      });
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const tenantId = subscription.metadata?.tenantId;
      if (!userId || !tenantId) {
        logger.warn(event.type, "Missing metadata", subscription.metadata);
        return res.status(400).send("Missing metadata");
      }

      logger.info(
        "Processing subscription deleted, tenantId",
        tenantId,
        "subcription",
        subscription.id
      );

      // Check it was not deleted during a callback url processing
      const tenantSubscription = await prisma.tenant.findFirstOrThrow({
        where: {
          id: tenantId
        }
      });

      if (
        tenantSubscription?.stripeSubscriptionId === subscription.id &&
        tenantSubscription?.stripeCustomerId === subscription.customer
      ) {
        await prisma.tenant.updateMany({
          where: {
            id: tenantId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string
          },
          data: {
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            stripeUserId: null,
            ...getPlanLimits()
          }
        });
      } else {
        logger.warn(
          "Will not delete a subscription which does not match tenant",
          tenantId,
          "cancelled subcriptionId",
          subscription.id,
          "existing subcriptionId",
          tenantSubscription?.stripeSubscriptionId
        );
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const tenantId = subscription.metadata?.tenantId;
      if (!userId || !tenantId) {
        logger.warn(event.type, "Missing metadata", subscription.metadata);
        return res.status(400).send("Missing metadata");
      }

      logger.info(
        "Processing subscription updated",
        "tenantId",
        tenantId,
        "subscription",
        subscription.id
      );
      await prisma.tenant.update({
        where: {
          id: tenantId
        },
        data: {
          planId: subscription.items.data[0].price.lookup_key,
          ...fromSubscription(subscription),
          ...getPlanLimits(subscription.items.data[0].price.lookup_key)
        }
      });
    }

    return res.send({ received: true });
  } catch (error) {
    logger.warn("Error processing webhook", error);
    return res.status(400).send({ error: "Webhook Error" });
  }
}
