import { formatMarkdown } from "@/components/formatMarkdown";
import { Zap, Shield, BarChart3, Users, Workflow, Code } from "lucide-react";

const features = [
  {
    name: "Lightning Fast",
    description:
      "Built on a modern stack for instant page loads and a snappy experience your users will love.",
    icon: Zap
  },
  {
    name: "Secure by Default",
    description:
      "Authentication, encrypted sessions, and best-practice security baked in from day one.",
    icon: Shield
  },
  {
    name: "Built-in Analytics",
    description: "Understand your users with dashboards and metrics that work out of the box.",
    icon: BarChart3
  },
  {
    name: "Team Collaboration",
    description: "Invite teammates, manage roles, and work together in a shared workspace.",
    icon: Users
  },
  {
    name: "Powerful Automations",
    description:
      "Automate repetitive work with background jobs, scheduled tasks, and webhooks.",
    icon: Workflow
  },
  {
    name: "Developer Friendly",
    description: "A clean API and typed SDK so you can build and integrate in record time.",
    icon: Code
  }
];

export const Features = () => {
  return (
    <div className="relative py-24 sm:py-32 overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Why teams choose{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </span>
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Everything you need to build, launch, and scale your product — all in one place
          </p>
        </div>

        {/* Feature grid */}
        <div className="mx-auto mt-16 sm:mt-20 lg:mt-24 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="group relative rounded-2xl border border-border bg-card/50 p-8 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                  opacity: 0
                }}
              >
                {/* Icon container */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary transition-all duration-300 mb-6">
                  <feature.icon
                    className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300"
                    aria-hidden="true"
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.name}
                </h3>
                <p className="text-muted-foreground leading-7">
                  {formatMarkdown(feature.description)}
                </p>
              </div>
            ))}
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
  );
};
