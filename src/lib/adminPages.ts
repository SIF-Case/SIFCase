import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Database,
  Table2,
  ClipboardList,
  BookOpen,
  ScrollText,
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
  { key: "schemes", label: "Funds", href: "/admin/schemes", icon: Table2, editable: true },
  { key: "fundDetails", label: "Fund Details", href: "/admin/fund-details", icon: ClipboardList, editable: true },
  { key: "articles", label: "Articles", href: "/admin/articles", icon: BookOpen, editable: true },
  { key: "logs", label: "Cron Logs", href: "/admin/logs", icon: ScrollText, editable: false },
];

export function getAdminPage(key: string): AdminPageDef | undefined {
  return ADMIN_PAGES.find(p => p.key === key);
}
