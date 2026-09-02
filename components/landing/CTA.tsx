import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const CTA = () => {
  return (
    <div className="relative isolate mt-24 sm:mt-32 overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-12 md:p-16 shadow-2xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative mx-auto max-w-3xl text-center">
            {/* Headline */}
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl text-primary-foreground mb-6">
              Ready to get started?
            </h2>

            {/* Description */}
            <p className="mx-auto max-w-2xl text-xl leading-8 text-primary-foreground/80 mb-10">
              Join thousands of teams already building with {process.env.NEXT_PUBLIC_APP_NAME}.
              Get started with a 14-day free trial.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg shadow-lg transition-all w-full sm:w-auto rounded-xl font-semibold"
              >
                <Link href="/auth/signIn?callbackUrl=/dashboard">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg w-full sm:w-auto rounded-xl font-semibold border-primary-foreground/20 text-primary hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-primary-foreground/20">
              <div>
                <div className="text-3xl font-bold text-primary-foreground">50K+</div>
                <p className="mt-1 text-sm text-primary-foreground/80">Active users</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-foreground">99.9%</div>
                <p className="mt-1 text-sm text-primary-foreground/80">Uptime</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-foreground">24/7</div>
                <p className="mt-1 text-sm text-primary-foreground/80">Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
