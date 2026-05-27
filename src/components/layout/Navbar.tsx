"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "All SIFs", href: "/sifs" },
  { label: "Performance", href: "/performance" },
  { label: "Compare", href: "/compare" },
  { label: "NFOs", href: "/nfos" },
  { label: "Learn", href: "/learn" },
];

interface NavbarProps {
  variant?: "light" | "dark";
}

export function Navbar({ variant = "light" }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = variant === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        isDark
          ? "bg-brand-navy border-b border-white/10"
          : "bg-white border-b border-rule-soft"
      )}
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className={cn(
                "w-7 h-7 rounded-[7px] flex items-center justify-center text-xs font-bold",
                isDark
                  ? "bg-primary text-white"
                  : "bg-brand-navy text-white"
              )}
            >
              S
            </div>
            <span
              className={cn(
                "text-[15px] font-bold tracking-tight",
                isDark ? "text-white" : "text-brand-navy"
              )}
            >
              SIFCase
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-[8px] text-[13.5px] font-medium",
                  isDark
                    ? "text-[#D8E8F7] hover:text-white hover:bg-white/8"
                    : "text-body hover:text-heading hover:bg-surface"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 rounded-[10px] text-[13.5px] font-semibold bg-primary text-white hover:bg-primary-hover shadow-btn"
            >
              Login
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden p-2 rounded-[8px]",
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-muted hover:text-heading hover:bg-surface"
            )}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={cn(
            "md:hidden border-t px-6 py-4 space-y-1",
            isDark
              ? "border-white/10 bg-brand-navy"
              : "border-rule-soft bg-white"
          )}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "block px-3 py-2.5 rounded-[8px] text-[14px] font-medium",
                isDark
                  ? "text-[#D8E8F7] hover:text-white hover:bg-white/8"
                  : "text-body hover:text-heading hover:bg-surface"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <a
              href="/login"
              className="block w-full text-center px-4 py-2.5 rounded-[10px] text-[14px] font-semibold bg-primary text-white hover:bg-primary-hover"
            >
              Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
