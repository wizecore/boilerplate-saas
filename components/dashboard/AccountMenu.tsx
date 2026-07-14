import Link from "next/link";
import { House, LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "system", icon: Monitor, label: "System theme" },
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "dark", icon: Moon, label: "Dark theme" }
] as const;

export const AccountMenu = ({
  name,
  email,
  image
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="overflow-hidden rounded-full h-8 w-8">
          {image ? (
            <img
              src={image}
              alt="Profile"
              className="inset-0 object-cover h-8 w-8 rounded-full"
            />
          ) : (
            <User />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 [&_svg]:stroke-[1.5]">
        <DropdownMenuItem asChild className="h-auto py-2">
          <Link href="/settings/general">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {name ?? email}
              </span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
            <Settings className="ml-auto" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">Theme</span>
          <div className="flex items-center gap-0.5 rounded-full border border-border p-0.5">
            {themeOptions.map(({ value, icon: ThemeIcon, label }) => (
              <button
                key={value}
                type="button"
                aria-label={label}
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                  theme === value
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ThemeIcon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/">
            <House />
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" asChild>
          <Link href="/auth/signOut">
            <LogOut />
            Log out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
