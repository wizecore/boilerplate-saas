import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { capitalize, cn } from "@/lib/utils";

interface PricingProps {
  id: string;
  title: string;
  tag?: string;
  price?: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  buttonNotice?: string;
  benefitList: string[];
}

export const plans = [
  {
    name: "Starter",
    id: "tier-starter",
    href: "/dashboard",
    price: { monthly: "$5" },
    description: "Perfect for small businesses and startups.",
    features: ["Up to 5 features", "Basic analytics", "Email support", "7-day data retention"],
    featured: false
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "/dashboard",
    price: { monthly: "$20" },
    description: "Ideal for growing businesses and agencies.",
    features: [
      "Up to 20 features",
      "Full analytics",
      "Advanced reports",
      "Slack & email support",
      "30-day data retention",
      "Competitor analysis",
      "Custom category tracking"
    ],
    featured: true
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: `mailto:${process.env.NEXT_PUBLIC_MAIL_FROM}`,
    price: { monthly: "Custom" },
    description: "For large organizations with advanced needs.",
    features: [
      "Unlimited features",
      "Full analytics",
      "Custom reporting",
      "24/7 priority support",
      "90-day data retention",
      "Advanced competitor analysis",
      "API access",
      "Custom integrations",
      "Dedicated account manager"
    ],
    featured: false
  }
];

export const Pricing = () => {
  return (
    <div className="py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Choose the right plan for your needs
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Get started with our free trial. No credit card required. Upgrade anytime.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 gap-x-4 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-3">
          {plans.map(tier => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-3xl p-8 ring-1 ring-gray-200 ${
                tier.featured ? "bg-primary/5" : ""
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                    Most popular
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold leading-8">{tier.name}</h3>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {tier.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {tier.price.monthly}
                  </span>
                  {tier.price.monthly !== "Custom" && (
                    <span className="text-sm font-semibold leading-6">/month</span>
                  )}
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                asChild
                className={`mt-8 w-full ${
                  tier.featured ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                <Link href={tier.href}>
                  {tier.price.monthly === "Custom" ? "Contact sales" : "Get started"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PricingCard = ({
  className,
  price
}: {
  className?: string;
  price: PricingProps;
}) => {
  return (
    <Card
      key={price.title}
      className={cn("drop-shadow-xl shadow-black/10 dark:shadow-white/10", className)}
    >
      <CardHeader>
        <CardTitle className="flex item-center justify-between">
          {price.title}
          {price.tag ? (
            <Badge variant="secondary" className="text-sm text-primary">
              {price.tag}
            </Badge>
          ) : null}
        </CardTitle>

        <div className="text-left py-2">
          <span className="text-2xl font-bold">{price.price}</span>
        </div>

        <CardDescription className="text-left md:leading-[1.2rem] md:min-h-[3.6rem]">
          {price.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button className="w-full" asChild>
          <Link
            href={price.buttonLink}
            className={"plausible-event-name=Pricing" + capitalize(price.id)}
          >
            {price.buttonText}
          </Link>
        </Button>

        {price.buttonNotice}
      </CardContent>

      <hr className="w-4/5 m-auto mb-4" />

      <CardFooter className="flex">
        <div className="space-y-4">
          {price.benefitList?.map((benefit: string) => (
            <span key={benefit} className="flex">
              <Check className="text-green-500" /> <h3 className="ml-2">{benefit}</h3>
            </span>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};
