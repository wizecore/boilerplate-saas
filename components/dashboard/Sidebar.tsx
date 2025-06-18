import Link from "next/link";
import { Settings } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/router";
import { cva } from "class-variance-authority";
import { Logo } from "@/components/landing/Navbar";
import { dashboardMenu } from "@/components/dashboard/menu";

const classNames = cva(
  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
  {
    variants: {
      active: {
        true: "bg-accent text-accent-foreground",
        false: "text-muted-foreground"
      },
      hover: {
        true: "hover:text-foreground",
        false: "hover:text-muted-foreground"
      },
      animations: {
        true: "hover:scale-110 active:scale-90 active:border-1 active:border-primary/70 transition-transform",
        false: "transition-none"
      }
    },
    defaultVariants: {
      active: false,
      hover: true,
      animations: true
    }
  }
);

export function Sidebar() {
  const router = useRouter();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 pt-2.5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary md:h-8 md:w-8 md:text-base"
          title={process.env.NEXT_PUBLIC_APP_NAME}
        >
          <Logo />
          <span className="sr-only">{process.env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>

        {Object.entries(dashboardMenu).map(([_name, item]) => (
          <Tooltip key={item.title} delayDuration={150}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={classNames({ active: router.pathname?.startsWith(item.href) })}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.title}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <nav className="mt-auto flex flex-col items-center gap-4 px-2 pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              className={classNames({ active: router.pathname === "/settings" })}
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
}
