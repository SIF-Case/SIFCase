import { auth, signOut } from "@/auth";
import { getEffectiveAccess } from "@/lib/adminAuth";
import { ADMIN_PAGES } from "@/lib/adminPages";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck, Settings as SettingsIcon } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const access = await getEffectiveAccess(session.user.id);
  if (!access) redirect("/");

  const visiblePages = access.isSuperAdmin
    ? ADMIN_PAGES
    : ADMIN_PAGES.filter(p => {
        const perm = access.permissions.get(p.key);
        return !!(perm?.view || perm?.edit);
      });

  if (visiblePages.length === 0) redirect("/");

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

        {/* min-h-0 lets this flex child shrink below its content height, which is
            what makes overflow-y-auto actually scroll — without it the nav grows
            past the viewport and the last links (Settings, Logout) are cut off. */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5 admin-nav-scroll">
          {visiblePages.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}

          {access.isSuperAdmin && (
            <Link href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <SettingsIcon className="size-4 shrink-0" />
              Settings
            </Link>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button type="submit" className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-0 bg-transparent">
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
