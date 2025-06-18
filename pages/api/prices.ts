import { pick } from "@/lib/utils";
import { getStripe } from "@/lib/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getCompute } from "@/lib/compute";

export type PricesResponse = Pick<
  Stripe.Price,
  "id" | "unit_amount" | "currency" | "product" | "nickname"
>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cache } = await getCompute();

  const prices = await cache.getset(
    "prices",
    async () => {
      if (process.env.STRIPE_API_KEY) {
        const stripe = getStripe();
        const result = await stripe.prices.list({
          active: true,
          limit: 10,
          type: "recurring"
        });
        const priceIds = process.env.MONTHLY_PRICE_IDS?.split(",") ?? [];
        const prices = result.data
          .filter(price => priceIds.includes(price.id))
          .map(price => pick(price, "id", "unit_amount", "currency", "product", "nickname"))
          .sort((a, b) => a.unit_amount! - b.unit_amount!);
        return prices;
      } else {
        return [];
      }
    },
    60000
  );

  return res.status(200).json(prices);
}
