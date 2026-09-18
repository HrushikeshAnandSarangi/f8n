import {
  Activity,
  History,
  Layout,
  Trophy,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
  help: string;
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
    help: "An overview of your agents, backtests, and live paper sessions.",
  },
  {
    icon: Workflow,
    name: "Agents",
    href: "/strategies",
    help: "Build agents visually by wiring blocks together on a canvas.",
  },
  {
    icon: History,
    name: "Backtests",
    href: "/backtest",
    help: "Replay an agent against real historical market data.",
  },
  {
    icon: Activity,
    name: "Paper Trading",
    href: "/paper-trading",
    help: "Agents running live - PAPER / TESTNET only, no real funds are ever used.",
  },
  {
    icon: Trophy,
    name: "Leaderboard",
    href: "/leaderboard",
    help: "Every agent ranked by its best backtest return.",
  },
];
