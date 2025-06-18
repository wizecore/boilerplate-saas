import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/router";
import { About } from "@/components/settings/About";
import { General } from "@/components/settings/General";
import { str } from "@/lib/utils";
import { Notifications } from "@/components/settings/Notifications";

export default function Settings() {
  const router = useRouter();
  const activeTab = str(router.query.tab) ?? "general";

  return (
    <AppShell menuItem={{ title: "Settings", href: "/settings" }}>
      <div className="flex grow bg-muted/80 flex-col gap-4 p-4 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[120px_1fr]">
          <nav className="grid gap-4 text-sm text-muted-foreground">
            <Link
              href="/settings/general"
              className={`hover:text-primary ${
                activeTab === "general" ? "font-semibold text-primary" : ""
              }`}
            >
              General
            </Link>
            <Link
              href="/settings/notifications"
              className={`hover:text-primary ${
                activeTab === "notifications" ? "font-semibold text-primary" : ""
              }`}
            >
              Notifications
            </Link>
            <Link
              href="/settings/about"
              className={`hover:text-primary ${
                activeTab === "about" ? "font-semibold text-primary" : ""
              }`}
            >
              About
            </Link>
          </nav>
          <div className="grid gap-6">
            {activeTab === "general" && <General />}

            {activeTab === "about" && <About />}

            {activeTab === "notifications" && <Notifications />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
