import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Users, Activity, Zap, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export const Hero = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="relative isolate overflow-hidden bg-background">
      {/* Soft background accent */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 lg:flex lg:items-center lg:gap-x-16 lg:px-8 lg:py-32">
        {/* Left side - Main content */}
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:max-w-xl">
          {/* Headline */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ship faster
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-lg">
            {process.env.NEXT_PUBLIC_APP_NAME} gives your team the tools to launch, scale, and
            grow your product. Get started in minutes — no credit card required.
          </p>

          {/* Email input + CTA */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-14 px-6 text-base rounded-2xl"
            />
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 grid grid-cols-3 gap-6 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">Free 14-day trial</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">No credit card</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">Cancel anytime</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 pt-8 border-t border-border">
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Users className="h-6 w-6 text-primary" />
                50K+
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Active users</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Activity className="h-6 w-6 text-primary" />
                99.9%
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Uptime SLA</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Zap className="h-6 w-6 text-primary" />
                24/7
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Support</p>
            </div>
          </div>
        </div>

        {/* Right side - Product mockup */}
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-20">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="relative">
              {/* Main dashboard mockup */}
              <div className="relative rounded-3xl bg-card p-8 shadow-2xl ring-1 ring-border">
                <div className="space-y-4">
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <LayoutDashboard className="h-16 w-16 text-primary-foreground/90" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded-full w-3/4" />
                    <div className="h-3 bg-muted/60 rounded-full w-1/2" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 ring-2 ring-card"
                          />
                        ))}
                      </div>
                      <div className="h-8 w-20 bg-primary rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-2xl bg-gradient-to-br from-primary to-primary/60 opacity-20 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-40 w-40 rounded-2xl bg-gradient-to-br from-primary/60 to-primary/40 opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
