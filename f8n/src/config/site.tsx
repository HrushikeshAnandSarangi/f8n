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
    name: "Mutual Funds",
    href: "/mutualFund",
  },
  {
    icon: LineChart,
    name: "Stock Analysis",
    href: "/stock-analysis",
  },
  {
    icon: ArrowRightLeft,
    name: "Stock Comparison",
    href: "/compare",
  },
  {
    icon: TrendingUp,
    name: "Ongoing Trend",
    href: "/realtime-trend",
  },
  {
    icon: Eye,
    name: "My Watchlist",
    href: "/watchlist",
  },
  {
    icon: Briefcase,
    name: "Holdings",
    href: "/holdings",
  },
  {
    icon: BarChart3,
    name: "Analysis",
    href: "/analyst",
  },
  {
    icon: MessagesSquare,
    name: "Recommendations",
    href: "/recommendations",
  },
  {
    icon: Newspaper,
    name: "News Hub",
    href: "/news",
  }
];