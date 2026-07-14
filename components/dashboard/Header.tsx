import Link from "next/link";
import { PanelLeft, Settings } from "lucide-react";

import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { dashboardMenu } from "@/components/dashboard/menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/components/useSession";
import { Logo } from "@/components/Branding";
import { NavItem } from "@/types";

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

  return (
    <header className="sticky top-0 z-30 flex justify-between h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            aria-describedby="menu"
            side="left"
            className="sm:max-w-xs p-4 border flex flex-col h-full justify-between"
          >
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="group flex h-10 shrink-0 items-center justify-start gap-2 rounded-full text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Logo />
              </Link>

              {Object.values(dashboardMenu).map(item => (
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

            <nav className="grid gap-6 text-lg font-medium">
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
                  <BreadcrumbPage className="line-clamp-1 break-all">
                    {name ?? id}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex-1 grow-0">
        <AccountMenu
          name={session?.user?.name}
          email={session?.user?.email}
          image={session?.user?.image}
        />
      </div>
    </header>
  );
}
