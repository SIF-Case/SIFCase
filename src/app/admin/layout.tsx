import { requireAdmin } from "@/lib/adminAuth";
import Link from "next/link";
import { LayoutDashboard, Users, Database, ScrollText, LogOut, ShieldCheck, BookOpen, Table2, ClipboardList } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/funds", label: "Funds & NAV", icon: Database },
  { href: "/admin/schemes", label: "Funds", icon: Table2 },
  { href: "/admin/fund-details", label: "Fund Details", icon: ClipboardList },
  { href: "/admin/articles", label: "Articles", icon: BookOpen },
  { href: "/admin/logs", label: "Cron Logs", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[#F4F6FA]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-brand-navy flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 text-primary" />
            <div>
              <p className="text-[13px] font-bold text-white">SIFcase Admin</p>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Control panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="size-4" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
