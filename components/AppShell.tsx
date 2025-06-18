import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { applyFlags } from "@/components/landing/Navbar";
import { Loader } from "@/components/Loader";
import { useRouteLoading } from "@/components/useRouteLoading";
import { JSONSafe, NavItem, User } from "@/types";
import { signIn, useSession } from "next-auth/react";
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
  const { data: session, status } = useSession({
    required: false
  });
  const { data: user, isLoading } = useSWR<JSONSafe<User>>("/api/user");

  useEffect(() => {
    if (!user && !isLoading && pathname) {
      signIn(undefined, {
        callbackUrl: pathname
      });
    }
  }, [user, isLoading, pathname]);

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
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {loading && <Loader />}
      <Sidebar />
      <div className="flex flex-col min-h-screen sm:pl-14">
        {(header ?? true) && <Header id={id} name={name} menuItem={menuItem} />}
        <main className="grow flex flex-col justify-start">{children}</main>
      </div>
    </div>
  );
};
