import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { applyFlags } from "@/components/Branding";
import { Loader } from "@/components/Loader";
import { useLocalStorage } from "@/components/useLocalStorage";
import { useRouteLoading } from "@/components/useRouteLoading";
import { useSession } from "@/components/useSession";
import { fetcherIgnore404 } from "@/lib/utils";
import { JSONSafe, NavItem, User } from "@/types";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useSWR from "swr";

export const AppShell = ({
  id,
  children,
  menuItem,
  header,
  name
}: {
  id?: string;
  name?: string;
  children: React.ReactNode;
  menuItem?: Pick<NavItem, "title" | "href">;
  header?: boolean;
}) => {
  const loading = useRouteLoading();
  const { isReady, pathname } = useRouter();
  const { data: session, status } = useSession();
  const { data: user, isLoading } = useSWR<JSONSafe<User>>("/api/user", fetcherIgnore404);
  const [isSidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>(
    "sidebar.collapsed",
    false
  );

  useEffect(() => {
    if (!user && !isLoading && pathname) {
      signIn(undefined, {
        callbackUrl: pathname
      });
    }
  }, [user, isLoading, pathname]);

  // Disable macOS rubber-band overscroll while the dashboard is mounted so the
  // sticky header stays put; the marketing pages keep their native bounce.
  useEffect(() => {
    document.body.classList.add("no-overscroll");
    return () => document.body.classList.remove("no-overscroll");
  }, []);

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (!isReady) {
    return null;
  }

  applyFlags(user);

  return (
    <div className="AppShell flex min-h-screen w-full flex-col">
      {loading && <Loader />}
      <Sidebar collapsed={isSidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div
        className={`flex flex-col min-h-screen ${isSidebarCollapsed ? "sm:pl-14" : "sm:pl-44"}`}
      >
        {(header ?? true) && <Header id={id} name={name} menuItem={menuItem} />}
        <main className="grow flex flex-col justify-start">{children}</main>
      </div>
    </div>
  );
};
