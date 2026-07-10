import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Database,
  Table2,
  ClipboardList,
  BookOpen,
  ScrollText,
  Newspaper,
  HelpCircle,
  ClipboardCheck,
  Building2,
  BarChart2,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export interface AdminPageDef {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  editable: boolean;
}

export const ADMIN_PAGES: AdminPageDef[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard, editable: false },
  { key: "users", label: "Users", href: "/admin/users", icon: Users, editable: true },
  { key: "clients", label: "Clients", href: "/admin/clients", icon: UserSquare2, editable: true },
  { key: "funds", label: "Funds & NAV", href: "/admin/funds", icon: Database, editable: true },
  { key: "navRecords", label: "NAV Records", href: "/admin/nav-records", icon: BarChart2, editable: false },
  { key: "schemes", label: "Funds", href: "/admin/schemes", icon: Table2, editable: true },
  { key: "fundDetails", label: "Fund Details", href: "/admin/fund-details", icon: ClipboardList, editable: true },
  { key: "fundHouses", label: "Fund Houses", href: "/admin/fund-houses", icon: Building2, editable: true },
  { key: "nfos", label: "NFOs", href: "/admin/nfos", icon: Rocket, editable: true },
  { key: "articles", label: "Articles", href: "/admin/articles", icon: BookOpen, editable: true },
  { key: "news", label: "SIF News", href: "/admin/news", icon: Newspaper, editable: true },
  { key: "faqs", label: "FAQs", href: "/admin/faqs", icon: HelpCircle, editable: true },
  { key: "suitability", label: "Suitability Quiz", href: "/admin/suitability", icon: ClipboardCheck, editable: true },
  { key: "logs", label: "Cron Logs", href: "/admin/logs", icon: ScrollText, editable: false },
];

export function getAdminPage(key: string): AdminPageDef | undefined {
  return ADMIN_PAGES.find(p => p.key === key);
}
