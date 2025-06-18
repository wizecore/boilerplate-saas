interface RouteProps {
  id: string;
  href: string;
  label: string;
  active: boolean;
  primary?: boolean;
  overflow?: boolean;
}

export const getLandingMenu = (path: string, signedIn: boolean): RouteProps[] => [
  {
    id: "home",
    href: "/",
    label: "Home",
    active: path === "/"
  },
  {
    id: "pricing",
    href: "/#pricing",
    label: "Pricing",
    active: false
  },
  {
    id: signedIn ? "dashboard" : "signIn",
    href: signedIn ? "/dashboard" : "/auth/signIn?callbackUrl=/dashboard",
    label: signedIn ? "Dashboard" : "Try For Free",
    active: path === "/dashboard" || path === "/auth/signIn",
    primary: true
  }
];
