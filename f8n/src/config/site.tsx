import {
  Activity,
  History,
  Layout,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "f8n",
  description: "Build, backtest, and paper-trade crypto arbitrage agents",
};

export const navigations: Navigation[] = [
  {
    icon: Layout,
    name: "Dashboard",
    href: "/",
  },
  {
    icon: Workflow,
    name: "Agents",
    href: "/strategies",
  },
  {
    icon: History,
    name: "Backtests",
    href: "/backtest",
  },
  {
    icon: Activity,
    name: "Paper Trading",
    href: "/paper-trading",
  },
];
