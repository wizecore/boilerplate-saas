import { absoluteUrl, str } from "@/lib/utils";
import { getStripe, getTenantSubscription, updateSubscription } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/user";
import logger from "@/lib/logger";
import { plans } from "@/components/landing/Pricing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions(req));
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Handle subscription status check after successful payment
  const sessionId = req.query.session_id as string;
  if (sessionId) {
    try {
      await updateSubscription(sessionId);
    } catch (error) {
      logger.warn("Failed to check subscription status", error);
    }

    return res.redirect(absoluteUrl("/dashboard"));
  }

  const promotionCode = str(req.query.promotionCode);
  const plan = str(req.query.plan);
  if (!plan) {
    return res.status(400).json({ error: "Plan required" });
  }

  const planIndex = Object.keys(plans).indexOf(plan);
  if (planIndex === -1) {
    logger.warn("Plan not found", plan);
    return res.status(400).json({ error: "Invalid plan" });
  }

  const stripe = await getStripe();
  const priceIds = process.env.MONTHLY_PRICE_IDS?.split(",") ?? [];
  const priceId = priceIds[planIndex];
  if (!priceId) {
    logger.warn("Price ID not found", plan, planIndex);
    return res.status(400).json({ error: "Invalid plan" });
  }

  try {
    const sub = await getTenantSubscription(user.tenantId);
    if (sub && sub.stripePriceId === priceId) {
      logger.info("User already has this subscription", sub.stripePriceId);
      return res.redirect(absoluteUrl("/dashboard"));
    }

    const successUrl = absoluteUrl(`/api/subscribe/${plan}?session_id={CHECKOUT_SESSION_ID}`);

    let stripeCustomer = await stripe.customers
      .list({
        email: session.user.email,
        limit: 1
      })
      .then(customers => customers.data[0]);

    if (!stripeCustomer) {
      stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
        metadata: {
          userId: session.user.id,
          tenantId: user.tenantId
        }
      });
      logger.info("Created stripe customer", stripeCustomer.id, session.user.email);
    } else {
      logger.info("Existing stripe customer", stripeCustomer.id, session.user.email);
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: successUrl,
      cancel_url: absoluteUrl("/pricing"),
      mode: "subscription",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer: stripeCustomer.id,
      customer_update: {
        address: "auto"
      },
      discounts: promotionCode ? [{ promotion_code: promotionCode }] : undefined,
      automatic_tax: {
        enabled: true
      },
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      metadata: {
        userId: session.user.id,
        tenantId: user.tenantId
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tenantId: user.tenantId
        }
      }
    });

    const url = stripeSession.url;
    if (!url) {
      return res.status(500).json({ error: "Failed to prepare session" });
    }
    res.redirect(url);
  } catch (error) {
    logger.warn("Failed to create session", error);
    return res.status(500).json({ error: "Failed to create session" });
  }
}
