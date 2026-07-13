import { AppWindowMacIcon } from "lucide-react";

import logger from "@/lib/logger";
import { cn } from "@/lib/utils";
import { User } from "@/types";

/**
 * Generic brand marks for the template. Swap `AppWindowMacIcon` (or render your
 * own SVG asset) to rebrand. Everything in the dashboard shell imports the mark
 * from here so the dashboard bundle never pulls in the landing `Navbar`.
 */
export const Icon = ({ className = "" }: { className?: string }) => (
  <AppWindowMacIcon className={cn("stroke-[1.5]", className)} />
);

export const Logo = ({
  className = "",
  counter
}: {
  button?: boolean;
  className?: string;
  counter?: number;
}) => (
  <div className="flex flex-row items-center justify-center relative">
    <AppWindowMacIcon className={cn("stroke-1.5 h-8 w-8", className)} />

    {counter && (
      <span className="absolute bottom-0 right-0 flex items-center justify-center text-[8px] bg-red-400 text-white border border-red rounded-full px-1 pt-0.5">
        {counter}
      </span>
    )}
  </div>
);

/**
 * Toggle Plausible tracking opt-out based on the user's feature flags.
 */
export const applyFlags = (user?: Pick<User, "flags">) => {
  if (!user) {
    return;
  }

  if (user.flags.includes("tracking-")) {
    if (!localStorage.getItem("plausible_ignore")) {
      logger.info("Disabling tracking");
      localStorage.setItem("plausible_ignore", "true");
    }
  } else if (localStorage.getItem("plausible_ignore")) {
    logger.info("Enabling tracking");
    localStorage.removeItem("plausible_ignore");
  }
};
