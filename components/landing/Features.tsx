import { formatMarkdown } from "@/components/formatMarkdown";
import { ClipboardCheck, Clock, FileCheck, Lock, Mail, Smartphone } from "lucide-react";

const features = [
  {
    name: "Next.js",
    description:
      "Next.js is a React framework for building server-side rendered and static web applications.",
    icon: Mail
  },
  {
    name: "Tailwind CSS",
    description:
      "Tailwind CSS is a utility-first CSS framework for rapidly building custom designs.",
    icon: Lock
  },
  {
    name: "Shadcn UI",
    description:
      "Shadcn UI is a library of reusable components for building modern web applications.",
    icon: ClipboardCheck
  },
  {
    name: "Prisma",
    description: "Prisma is an open-source database toolkit for Node.js and TypeScript.",
    icon: Smartphone
  },
  {
    name: "BullMQ",
    description: "BullMQ is a message queue for Node.js.",
    icon: FileCheck
  },
  {
    name: "Plausible Analytics",
    description: "Plausible Analytics is a lightweight and privacy-friendly analytics tool.",
    icon: Clock
  }
];

export const Features = () => {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to streamline your business
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_DESCRIPTION}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map(feature => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <feature.icon
                    className="h-5 w-5 flex-none text-primary"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{formatMarkdown(feature.description)}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};
