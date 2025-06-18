import { CheckCheck, Home, List } from "lucide-react";

import { NavItem } from "@/types";

export const dashboardMenu = {
  dashboard: { title: "Dashboard", href: "/dashboard", icon: Home },
  task: { title: "Task", href: "/task", icon: CheckCheck },
  journal: { title: "Journal", href: "/journal", icon: List }
} as const satisfies Record<string, NavItem>;
