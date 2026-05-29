"use client";

import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { AuthModal } from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { label: "All SIFs", href: "/sifs" },
  { label: "Performance", href: "/performance" },
  { label: "Compare", href: "/compare" },
  { label: "NFOs", href: "/nfos" },
  { label: "Read", href: "/read" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-rule-soft">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-xs font-bold bg-brand-navy text-white">
                S
              </div>
              <span className="text-[15px] font-bold tracking-tight text-brand-navy">SIFCase</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href}
                  className="px-3.5 py-2 rounded-[8px] text-[13.5px] font-medium text-body hover:text-heading hover:bg-surface">
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-24 h-8 rounded-[10px] bg-surface animate-pulse" />
              ) : user ? (
                <div className="relative">
                  <button onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 pl-2 pr-3 h-8 rounded-full border border-rule hover:border-rule-strong text-body transition-colors">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="size-5 rounded-full" />
                    ) : (
                      <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                        {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-[12.5px] font-medium max-w-[120px] truncate">
                      {user.name ?? user.email ?? "Account"}
                    </span>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-white border border-rule rounded-[14px] shadow-premium py-1.5">
                        <div className="px-4 py-2.5 border-b border-rule">
                          <p className="text-[12px] font-semibold text-heading truncate">{user.name ?? "Account"}</p>
                          <p className="text-[11px] text-muted truncate">{user.email ?? (session.user as { phone?: string }).phone ?? ""}</p>
                        </div>
                        <a href="/dashboard"
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-body hover:bg-surface transition-colors">
                          <User className="size-3.5" /> My Dashboard
                        </a>
                        <button onClick={() => { signOut(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-loss hover:bg-surface transition-colors">
                          <LogOut className="size-3.5" /> Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 rounded-[10px] text-[13.5px] font-semibold bg-primary text-white hover:bg-primary-hover shadow-btn">
                  Login
                </button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-[8px] text-muted hover:text-heading hover:bg-surface"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-rule-soft bg-white px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}
                className="block px-3 py-2.5 rounded-[8px] text-[14px] font-medium text-body hover:text-heading hover:bg-surface"
                onClick={() => setMobileOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <User className="size-4 text-muted" />
                    <span className="text-[13px] text-body truncate">{user.name ?? user.email ?? "Account"}</span>
                  </div>
                  <button onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[8px] text-[14px] font-medium text-loss hover:bg-surface">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              ) : (
                <button onClick={() => { setMobileOpen(false); setAuthOpen(true); }}
                  className="block w-full text-center px-4 py-2.5 rounded-[10px] text-[14px] font-semibold bg-primary text-white hover:bg-primary-hover">
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
