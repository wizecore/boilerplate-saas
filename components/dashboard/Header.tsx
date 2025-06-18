import Link from "next/link";
import { PanelLeft, Settings, User } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { dashboardMenu } from "@/components/dashboard/menu";
import { useSession } from "next-auth/react";
import { NavItem } from "@/types";
import { useTheme } from "next-themes";
import { Logo } from "@/components/landing/Navbar";

export function Header({
  id,
  name,
  menuItem
}: {
  id?: string;
  name?: string;
  menuItem?: Pick<NavItem, "title" | "href">;
}) {
  const { data: session } = useSession();
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex justify-between h-14 items-center gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="sm:max-w-xs border flex flex-col h-full justify-between"
          >
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full dark:bg-primary/20 bg-primary/20 text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Logo />
                <span className="sr-only">{process.env.NEXT_PUBLIC_APP_NAME}</span>
              </Link>

              {Object.entries(dashboardMenu).map(([_name, item]) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              ))}
            </nav>

            <nav className=" grid gap-6 text-lg font-medium">
              <Link
                href="/settings"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <Breadcrumb className="flex grow">
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {menuItem && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={menuItem.href}>{menuItem.title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            {id && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{name ?? id}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex-1 grow-0">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full h-8 w-8"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="inset-0 object-cover h-8 w-8 rounded-full"
                />
              ) : (
                <User />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{session?.user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                href="#"
                onClick={e => {
                  e.preventDefault();
                  setTheme("dark");
                }}
              >
                Dark
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="#"
                onClick={e => {
                  e.preventDefault();
                  setTheme("light");
                }}
              >
                Light
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="mailto:ruslan@wizecore.com">Support</Link>
            </DropdownMenuItem>{" "}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">Home</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing">Upgrade</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/general">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/auth/signOut">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
