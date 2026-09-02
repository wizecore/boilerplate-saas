import { Mail, ClipboardCheck, LucideIcon, Brain } from "lucide-react";
import Head from "next/head";
import { formatMarkdown } from "@/components/formatMarkdown";

interface Step {
  name: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    name: "Step 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Mail
  },
  {
    name: "Step 2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: ClipboardCheck
  },
  {
    name: "Step 3",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    icon: Brain
  }
];

export const HowItWorks = () => {
  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How it works",
    description: "Step by step guide to use the app",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.description,
      url: "#howItWorks",
      position: index + 1
    }))
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToStructuredData) }}
        />
      </Head>
      <div className="relative py-24 sm:py-32 overflow-hidden" id="how-it-works">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-4">
              How it works
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Get started in{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                three simple steps
              </span>
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Our boilerplate nextjs object is a simple and easy to use boilerplate for nextjs
              projects.
            </p>
          </div>

          {/* Steps with connecting lines */}
          <div className="mx-auto mt-16 sm:mt-20 lg:mt-24 max-w-6xl">
            <div className="relative">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8 relative">
                {steps.map((step, index) => (
                  <div
                    key={step.name}
                    className="relative flex flex-col items-center text-center group"
                    style={{
                      animationDelay: `${index * 200}ms`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                      opacity: 0
                    }}
                  >
                    {/* Step number badge */}
                    <div className="relative mb-6">
                      {/* Pulsing background */}
                      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-300" />

                      {/* Icon container */}
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 shadow-lg ring-1 ring-primary/20">
                        <step.icon className="h-10 w-10 text-primary" aria-hidden="true" />
                      </div>

                      {/* Step number */}
                      <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {step.name}
                    </h3>
                    <p className="text-muted-foreground leading-7 max-w-xs">
                      {formatMarkdown(step.description)}
                    </p>

                    {/* Arrow indicator (mobile only) */}
                    {index < steps.length - 1 && (
                      <div className="mt-8 lg:hidden">
                        <div className="h-8 w-0.5 bg-gradient-to-b from-primary/40 to-transparent mx-auto" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
    </>
  );
};
