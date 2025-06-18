import { Button } from "@/components/ui/button";
import Link from "next/link";

export const CTA = () => {
  return (
    <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {process.env.NEXT_PUBLIC_APP_NAME}
          <br />
          {process.env.NEXT_PUBLIC_APP_DESCRIPTION}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          Speed your business up with our Next.js boilerplate. Start making your own in
          minutes, not days.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Link href="#how-it-works" className="text-sm font-semibold leading-6">
            See how it works <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
