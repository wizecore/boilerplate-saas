import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { capitalize, cn, fetcherIgnore404 } from "@/lib/utils";
import { User } from "@/types";
import { JSONSafe } from "@/types";
import useSWR from "swr";
import logger from "@/lib/logger";
import { AlignJustify } from "lucide-react";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getLandingMenu } from "@/components/landing/landingMenu";

export const Logo = ({
  className = "",
  counter
}: {
  button?: boolean;
  className?: string;
  counter?: number;
}) => (
  <div className="flex flex-row items-center justify-center relative">
    <div
      className={cn(
        "h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center",
        className
      )}
    >
      <span className="text-primary-foreground font-bold text-lg">
        {process.env.NEXT_PUBLIC_APP_NAME?.charAt(0) ?? "A"}
      </span>
    </div>

    {counter && (
      <span className="absolute bottom-0 right-0 flex items-center justify-center text-[8px] bg-red-400 text-white border border-red rounded-full px-1 pt-0.5">
        {counter}
      </span>
    )}
  </div>
);

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

export const Navbar = () => {
  const router = useRouter();
  const { data: user } = useSWR<JSONSafe<User>>("/api/user", fetcherIgnore404);
  applyFlags(user);
  const [isOpen, setIsOpen] = React.useState(false);
  const currentMenu = getLandingMenu(router.pathname, !!user?.id);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="pl-3 pr-2 md:px-4 container h-16 w-screen flex justify-between items-center">
          <NavigationMenuItem>
            <Link
              rel="noreferrer noopener"
              href="/"
              className="font-bold text-xl flex items-center gap-2 plausible-event-name=Home text-foreground hover:opacity-80 transition-opacity"
            >
              <Logo />
              <span className="leading-4">{process.env.NEXT_PUBLIC_APP_NAME}</span>
            </Link>
          </NavigationMenuItem>

          <nav className="hidden md:flex items-center gap-1">
            {currentMenu
              .filter(m => !m.overflow)
              .map(route => (
                <Button
                  asChild
                  rel="noreferrer noopener"
                  key={route.id}
                  size="sm"
                  variant={route.primary ? "default" : "ghost"}
                  className={cn(
                    "px-5 h-10 font-semibold rounded-xl",
                    route.primary
                      ? "shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/10",
                    `plausible-event-name=${capitalize(route.id)}`
                  )}
                >
                  <Link href={route.href}>{route.label}</Link>
                </Button>
              ))}

            {user && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="overflow-hidden rounded-full h-10 w-10 hover:bg-primary/10"
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/auth/signOut">Logout</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="ml-2">
              <ThemeToggle />
            </div>
          </nav>

          <div className="flex md:hidden items-center gap-2">
            {currentMenu
              .filter(route => route.primary)
              .map(route => (
                <Button
                  asChild
                  rel="noreferrer noopener"
                  key={route.id}
                  size="sm"
                  variant="default"
                  className={cn(
                    "px-4 text-sm h-9 rounded-xl font-semibold",
                    `plausible-event-name=${capitalize(route.id)}`
                  )}
                >
                  <Link href={route.href}>{route.label}</Link>
                </Button>
              ))}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <AlignJustify className="h-4 w-4" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  {currentMenu
                    .filter(route => !route.primary)
                    .map(route => (
                      <Button
                        asChild
                        key={route.id}
                        onClick={() => setIsOpen(false)}
                        variant="ghost"
                        className={cn(
                          "justify-start h-11",
                          `plausible-event-name=${capitalize(route.id)}`
                        )}
                      >
                        <Link href={route.href}>{route.label}</Link>
                      </Button>
                    ))}
                </nav>
              </SheetContent>
            </Sheet>

            <ThemeToggle />
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
