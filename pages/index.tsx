import { CTA } from "@/components/landing/CTA";
import { FAQ } from "@/components/landing/FAQ";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { Pricing } from "@/components/landing/Pricing";
import { ScrollToTop } from "@/components/landing/ScrollToTop";

function Page() {
  return (
    <MarketingShell>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <FAQ />
      <ScrollToTop />
    </MarketingShell>
  );
}

export default Page;
