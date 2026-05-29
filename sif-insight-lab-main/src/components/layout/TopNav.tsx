import { Link } from "@tanstack/react-router";
import { Bell, Sun, Moon, Home, User as UserIcon, ChevronDown, LogOut, Settings, Wallet, Bookmark } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/explore", label: "Explore" },
  { to: "/market", label: "SIFs Universe" },
  { to: "/compare", label: "Compare" },
  { to: "/learn", label: "Learn" },
  { to: "/research", label: "Market Outlook" },
  { to: "/tools", label: "Tools" },
] as const;

export function TopNav() {
  const { theme, toggle } = useTheme();
  const { user, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const demoSignIn = () => signIn({ name: "Aarav Kapoor", email: "aarav@example.com" });

  return (
    <nav className="h-14 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-6 rounded-sm bg-primary" />
          <span className="font-semibold tracking-tight text-foreground text-[15px]">
            SIF<span className="text-primary">Hub</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-muted-foreground">
          {NAV.map((n) => {
            const Icon = "icon" in n ? n.icon : undefined;
            return (
              <Link
                key={n.to}
                to={n.to}
                className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                activeProps={{ className: "text-foreground" }}
                activeOptions={"exact" in n ? { exact: true } : undefined}
              >
                {Icon && <Icon className="size-3.5" />}
                {n.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              aria-label="Notifications"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative inline-flex items-center justify-center size-8 rounded-md border border-border hover:bg-surface transition"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-[12px] font-semibold">Notifications</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">3 new</span>
                </div>
                <ul className="max-h-80 overflow-auto divide-y divide-border">
                  {[
                    { t: "New SIF launched — Altiva Hybrid L/S", s: "2m ago", tone: "primary" },
                    { t: "Quant Ex Top 100 crossed ₹200 Cr AUM", s: "1h ago", tone: "positive" },
                    { t: "SEBI updates SIF taxation framework", s: "3h ago", tone: "gold" },
                    { t: "Weekly Market Outlook is live", s: "Yesterday", tone: "muted" },
                  ].map((n, i) => (
                    <li key={i} className="px-4 py-3 hover:bg-surface text-[12px]">
                      <div className="flex gap-2 items-start">
                        <span
                          className="mt-1 size-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              n.tone === "positive" ? "var(--color-positive)" :
                              n.tone === "gold" ? "var(--color-gold)" :
                              n.tone === "primary" ? "var(--color-primary)" :
                              "var(--color-muted-foreground)",
                          }}
                        />
                        <div>
                          <div className="text-foreground">{n.t}</div>
                          <div className="text-muted-foreground text-[11px] mt-0.5 font-mono">{n.s}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2 border-t border-border text-center">
                  <button className="text-[11px] text-primary font-medium hover:underline">View all</button>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="inline-flex items-center justify-center size-8 rounded-md border border-border hover:bg-surface transition"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {!user ? (
            <>
              <button
                onClick={demoSignIn}
                className="text-[12px] font-medium border border-border-strong rounded-md h-8 px-3 inline-flex items-center hover:bg-surface transition"
              >
                Sign in
              </button>
              <button
                onClick={demoSignIn}
                className="text-[12px] font-medium bg-primary text-primary-foreground rounded-md h-8 px-3 inline-flex items-center hover:opacity-90 transition"
              >
                Sign up
              </button>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 h-8 pl-1 pr-2 rounded-md border border-border-strong hover:bg-surface transition"
              >
                <span className="size-6 rounded-sm bg-primary text-primary-foreground inline-flex items-center justify-center text-[11px] font-semibold">
                  {user.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </span>
                <span className="text-[12px] font-medium hidden sm:inline">My Account</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[13px] font-semibold">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground">{user.email}</div>
                  </div>
                  <ul className="py-1 text-[13px]">
                    {[
                      { I: UserIcon, t: "Profile Overview" },
                      { I: Bookmark, t: "Watchlists & Saved SIFs" },
                      { I: Wallet, t: "Portfolio Tracker" },
                      { I: Bell, t: "Alerts & Notifications" },
                      { I: Settings, t: "Preferences & Settings" },
                    ].map(({ I, t }) => (
                      <li key={t}>
                        <button className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-surface text-left">
                          <I className="size-3.5 text-muted-foreground" /> {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border">
                    <button
                      onClick={() => { signOut(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-negative hover:bg-surface text-left"
                    >
                      <LogOut className="size-3.5" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
