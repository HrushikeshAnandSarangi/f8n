import {
  BarChart3,
  LineChart,
  ArrowRightLeft,
  TrendingUp,
  Eye,
  Briefcase,
  PieChart,
  MessagesSquare,
  Newspaper,
  Layout,
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
  description: "Your Personal Finance Assistant",
};

export const navigations: Navigation[] = [
  {
    icon: Layout,
    name: "Dashboard",
    href: "/",
  },
  {
    icon: PieChart,
    name: "Mutual Funds Agent",
    href: "/mutualFund",
  },
  {
    icon: LineChart,
    name: "Analysis Agent",
    href: "/stock-analysis",
  },
  {
    icon: ArrowRightLeft,
    name: "Comparison Agent",
    href: "/compare",
  },
  {
    icon: Eye,
    name: "Watchlist Agent",
    href: "/watchlist",
  },
  {
    icon: BarChart3,
    name: "Sentiment Agent",
    href: "/analyst",
  },
  {
    icon: MessagesSquare,
    name: "Recommendations Agent",
    href: "/recommendations",
  },
  {
    icon: Newspaper,
    name: "News Agent",
    href: "/news",
  }
];