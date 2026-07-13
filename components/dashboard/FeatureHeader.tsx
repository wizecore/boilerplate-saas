import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Circle, CheckCircle, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OptionalLink } from "@/components/OptionalLink";

export const FeatureHeader = ({
  title,
  subtitle,
  icon,
  children,
  checklist,
  actions,
  open: defaultOpen,
  collapsible = true
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  checklist?: { label: React.ReactNode; done?: boolean; link?: string }[];
  actions?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  }[];
  open?: boolean;
  collapsible?: boolean;
}) => {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  // When not collapsible, the parent controls open state via prop (e.g. "open when no items").
  // Local state is only used when the user can toggle.
  const isOpen = collapsible ? localOpen : defaultOpen;

  const handleToggle = () => {
    if (collapsible) {
      setLocalOpen(v => !v);
    }
  };

  return (
    <Card className="overflow-hidden py-4">
      <CardHeader className="pt-1">
        <CardTitle className="text-xl flex justify-between items-start gap-2">
          <div>
            <div className="shrink-0 flex items-center gap-2 leading-none">
              {icon && <span className="size-6">{icon}</span>} {title}
            </div>
            {subtitle && (
              <div className="mt-2 text-sm font-normal text-muted-foreground">{subtitle}</div>
            )}
          </div>
          <div>
            {collapsible && (
              <Button variant="ghost" onClick={handleToggle}>
                {isOpen ? "Hide" : "Learn more"}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="text-balance">{children}</div>

              {checklist && checklist.length > 0 && (
                <div className="flex-1 rounded-lg border bg-muted/30 p-4 space-y-3">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-muted-foreground">
                      {item.done === true ? (
                        <CheckCircle className="h-4 w-4  shrink-0" />
                      ) : item.done === false ? (
                        <Circle className="h-4 w-4 shrink-0" />
                      ) : (
                        <Dot className="h-4 w-4 shrink-0 scale-200" fill="currentColor" />
                      )}

                      <OptionalLink href={item.link} className="link">
                        {item.label}
                      </OptionalLink>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>

          {actions && actions.length > 0 && (
            <CardFooter className="pb-2">
              <div className="flex flex-row gap-2">
                {actions.map((action, i) =>
                  action.href ? (
                    <Button key={i} asChild variant={action.variant}>
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  ) : (
                    <Button key={i} variant={action.variant} onClick={action.onClick}>
                      {action.label}
                    </Button>
                  )
                )}
              </div>
            </CardFooter>
          )}
        </>
      )}
    </Card>
  );
};
