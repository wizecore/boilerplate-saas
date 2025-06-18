import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <h1 className="mt-10 text-4xl font-bold tracking-tight pb-1 sm:text-6xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_DESCRIPTION}
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link href="#how-it-works" className="text-sm font-semibold leading-6">
              See how it works <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
