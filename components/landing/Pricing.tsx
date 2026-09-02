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
      "Team collaboration",
      "Custom integrations"
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
      "SSO & advanced security",
      "API access",
      "Custom integrations",
      "Dedicated account manager"
    ],
    featured: false
  }
];

export const Pricing = () => {
  return (
    <div className="relative py-24 sm:py-32 overflow-hidden bg-background" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Simple,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              transparent pricing
            </span>
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Get started with our free trial. No credit card required. Upgrade anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-start gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
          {plans.map((tier, index) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                tier.featured
                  ? "bg-primary/5 ring-2 ring-primary shadow-2xl scale-105 lg:scale-110"
                  : "bg-card/50 ring-1 ring-border hover:ring-primary/40 hover:shadow-lg"
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
                opacity: 0
              }}
            >
              {/* Popular badge */}
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg">
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm leading-6 text-muted-foreground mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-x-2">
                    <span className="text-5xl font-bold tracking-tight">
                      {tier.price.monthly}
                    </span>
                    {tier.price.monthly !== "Custom" && (
                      <span className="text-lg font-semibold text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA button */}
                <Button
                  asChild
                  size="lg"
                  variant={tier.featured ? "default" : "secondary"}
                  className="w-full mb-8 rounded-xl font-semibold"
                >
                  <Link href={tier.href}>
                    {tier.price.monthly === "Custom" ? "Contact sales" : "Get started"}
                  </Link>
                </Button>

                {/* Features list */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    What&apos;s included
                  </p>
                  <ul role="list" className="space-y-3">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex gap-x-3 items-start">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                        </div>
                        <span className="text-sm leading-6 text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust message */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. Cancel anytime, no questions asked.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
