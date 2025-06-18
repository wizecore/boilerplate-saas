import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

export const getPublicStripe = async () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_STRIPE_KEY");
  }

  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
  if (!stripe) {
    throw new Error("Failed to load Stripe");
  }
  return stripe;
};

export const useStripe = () => {
  const [stripe, setStripe] = useState<Stripe | undefined>(undefined);

  useEffect(() => {
    getPublicStripe().then(setStripe);
  }, []);

  return stripe;
};
