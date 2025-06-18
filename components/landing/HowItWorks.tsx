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
      <div className="py-24 sm:py-32" id="how-it-works">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">How it works</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Streamline your nextjs boilerplate
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our boilerplate nextjs object is a simple and easy to use boilerplate for nextjs
              projects.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {steps.map(step => (
                <div key={step.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <step.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    {step.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">{formatMarkdown(step.description)}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};
