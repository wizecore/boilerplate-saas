import Link from "next/link";
import { ArrowLeftToLine, ArrowRightToLine, LucideIcon, Settings } from "lucide-react";

import { Icon } from "@/components/Branding";
import { dashboardMenu } from "@/components/dashboard/menu";
import { OptionalTooltip } from "@/components/OptionalTooltip";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { useRouter } from "next/router";

type SidebarItem = { title: string; href: string; icon: LucideIcon };

const sidebarClassNames = cva(
  "group fixed h-screen left-0 z-10 hidden flex-col bg-sidebar overflow-hidden sm:flex " +
    "after:pointer-events-none after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-sidebar-border",
  {
    variants: {
      collapsed: {
        true: "w-14",
        false: "w-44"
      }
    },
    defaultVariants: {
      collapsed: false
    }
  }
);

// No horizontal padding/justify here: the fixed 36px icon column keeps the icon at
// the same x-position whether collapsed or expanded, so nothing shifts on toggle.
const navItemClassNames = cva(
  "flex items-center h-9 rounded-lg outline-none select-none transition-colors duration-200 ease-out " +
    "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
  {
    variants: {
      active: {
        true: "bg-sidebar-accent text-foreground",
        false: "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
      }
    }
  }
);

const iconBoxClassNames = "flex h-9 w-9 items-center justify-center shrink-0";

const NavLink = ({
  item,
  active,
  collapsed
}: {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
}) => (
  <OptionalTooltip tooltip={item.title} show={collapsed}>
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={navItemClassNames({ active })}
    >
      <span className={iconBoxClassNames}>
        <item.icon className="h-[18px] w-[18px] stroke-[1.5]" />
      </span>
      {!collapsed && <span className="text-sm truncate pr-2">{item.title}</span>}
    </Link>
  </OptionalTooltip>
);

export function Sidebar({
  collapsed,
  onToggle
}: {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}) {
  const router = useRouter();

  const handleToggleCollapse = () => {
    onToggle(!collapsed);
  };

  const isActive = (href: string) => !!router.pathname?.startsWith(href);

  return (
    <aside className={sidebarClassNames({ collapsed })}>
      <div className="flex h-14 items-center border-b border-sidebar-border px-2.5 shrink-0">
        <Link
          href="/"
          title={process.env.NEXT_PUBLIC_APP_NAME}
          className="flex items-center select-none"
        >
          <span className={iconBoxClassNames}>
            <Icon className="h-6" />
          </span>
          {!collapsed && (
            <span className="font-bold truncate">{process.env.NEXT_PUBLIC_APP_NAME}</span>
          )}
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-2.5 py-3 overflow-y-auto">
        {Object.values(dashboardMenu).map(item => (
          <NavLink
            key={item.title}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <nav className="flex flex-col gap-0.5 px-2.5 pb-4 mt-auto">
        <NavLink
          item={{ title: "Settings", href: "/settings", icon: Settings }}
          active={isActive("/settings")}
          collapsed={collapsed}
        />

        <OptionalTooltip tooltip={collapsed ? "Expand" : "Collapse"} show={collapsed}>
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(navItemClassNames({ active: false }), "w-full")}
          >
            <span className={iconBoxClassNames}>
              {collapsed ? (
                <ArrowRightToLine className="h-[18px] w-[18px] stroke-[1.5]" />
              ) : (
                <ArrowLeftToLine className="h-[18px] w-[18px] stroke-[1.5]" />
              )}
            </span>
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </OptionalTooltip>
      </nav>
    </aside>
  );
}
