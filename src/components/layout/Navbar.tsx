"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { AuthModal } from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { label: "All SIFs", href: "/sifs" },
  { label: "Fund Houses", href: "/fund-houses" },
  { label: "Compare", href: "/compare" },
  { label: "NFOs", href: "/nfos" },
  { label: "Read", href: "/read" },
];

const AnimatedNavLink = ({
  href,
  children,
  onClick,
  onMouseEnter,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseEnter?: () => void;
  className?: string;
}) => {
  const defaultTextColor = "text-body group-hover:text-primary transition-colors";
  const hoverTextColor = "text-primary";
  const textSizeClass = "text-[13.5px] font-medium";

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`group relative inline-block overflow-hidden h-5 flex items-center ${textSizeClass} ${className}`}
    >
      <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
        <span className={defaultTextColor}>{children}</span>
        <span className={hoverTextColor}>{children}</span>
      </div>
    </a>
  );
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fundHousesOpen, setFundHousesOpen] = useState(false);
  const [brandNames, setBrandNames] = useState<{ brandName: string; companyName_short: string }[]>([]);
  const fundHousesRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const [headerShapeClass, setHeaderShapeClass] = useState("rounded-full");
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function loadBrandNames() {
    if (brandNames.length > 0) return;
    const res = await fetch("/api/fund-houses");
    if (res.ok) setBrandNames(await res.json());
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (fundHousesRef.current && !fundHousesRef.current.contains(e.target as Node)) {
        setFundHousesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    if (mobileOpen) {
      setHeaderShapeClass("rounded-[20px]");
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass("rounded-full");
      }, 300);
    }
    return () => {
      if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    };
  }, [mobileOpen]);

  const loading = status === "loading";
  const user = session?.user;

  return (
    <>
      <header
        className={`sticky top-4 z-50
                   flex flex-col items-center
                   pl-6 pr-6 py-2.5 backdrop-blur-md
                   ${headerShapeClass}
                   border border-rule/80 bg-white/80 shadow-[0_8px_30px_rgba(11,31,58,0.06)]
                   w-[calc(100%-2rem)] md:w-auto mx-auto
                   transition-[border-radius] duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between w-full h-10 gap-x-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6.5 h-6.5 rounded-[6px] flex items-center justify-center text-[10.5px] font-bold bg-brand-navy text-white">
              S
            </div>
            <span className="text-[14px] font-bold tracking-tight text-brand-navy">SIFCase</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {NAV_LINKS.map((link) =>
              link.label === "Fund Houses" ? (
                <div
                  key={link.href}
                  ref={fundHousesRef}
                  className="relative px-3 py-1.5 rounded-[8px] hover:bg-surface text-body hover:text-heading transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => {
                    setFundHousesOpen(true);
                    loadBrandNames();
                  }}
                  onClick={() => {
                    setFundHousesOpen((v) => !v);
                    loadBrandNames();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setFundHousesOpen((v) => !v);
                      loadBrandNames();
                    }
                  }}
                >
                  <span className="flex items-center gap-1 h-5">
                    <AnimatedNavLink href="#" onClick={(e) => e.preventDefault()}>
                      {link.label}
                    </AnimatedNavLink>
                    <ChevronDown
                      className={`size-3.5 shrink-0 text-faint transition-transform duration-300 ${
                        fundHousesOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </span>
                  {fundHousesOpen && (
                    <div
                      className="absolute left-0 top-full mt-2.5 z-30 bg-white border border-rule rounded-[14px] shadow-premium py-1.5 w-[480px] max-h-80 overflow-y-auto"
                      onMouseLeave={() => setFundHousesOpen(false)}
                    >
                      <a
                        href={link.href}
                        className="block px-4 py-2 text-[12px] font-semibold text-primary hover:bg-surface"
                      >
                        All Fund Houses &rarr;
                      </a>
                      <div className="border-t border-rule my-1" />
                      {brandNames.length === 0 ? (
                        <div className="px-4 py-2 text-[12px] text-muted">Loading…</div>
                      ) : (
                        <div className="grid grid-cols-2 px-2 pb-1">
                          {brandNames.map(({ brandName, companyName_short }) => (
                            <a
                              key={brandName}
                              href={`/fund-house/${encodeURIComponent(
                                brandName.toLowerCase().replace(/\s+/g, "-")
                              )}`}
                              className="flex flex-col px-3 py-2 rounded-[8px] hover:bg-surface transition-colors"
                            >
                              <span className="text-[13px] font-medium text-heading leading-tight">
                                {brandName}
                              </span>
                              {companyName_short && (
                                <span className="text-[11px] text-muted leading-tight mt-0.5">
                                  {companyName_short}
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div key={link.href} className="px-3 py-1.5">
                  <AnimatedNavLink href={link.href}>{link.label}</AnimatedNavLink>
                </div>
              )
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-7 rounded-full bg-surface animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 h-8 rounded-full border border-rule hover:border-rule-strong text-body transition-colors"
                >
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
                    <div className="absolute right-0 top-full mt-2.5 z-20 w-52 bg-white border border-rule rounded-[14px] shadow-premium py-1.5">
                      <div className="px-4 py-2.5 border-b border-rule">
                        <p className="text-[12px] font-semibold text-heading truncate">
                          {user.name ?? "Account"}
                        </p>
                        <p className="text-[11px] text-muted truncate">
                          {user.email ?? (session.user as { phone?: string }).phone ?? ""}
                        </p>
                      </div>
                      <a
                        href={user.isAdmin ? "/admin" : "/dashboard"}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-body hover:bg-surface transition-colors"
                      >
                        <User className="size-3.5" /> {user.isAdmin ? "Admin Panel" : "My Dashboard"}
                      </a>
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-loss hover:bg-surface transition-colors"
                      >
                        <LogOut className="size-3.5" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-full hover:bg-primary-hover shadow-btn transition-all duration-200"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-full text-muted hover:text-heading hover:bg-surface transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                     ${
                       mobileOpen
                         ? "max-h-[1000px] opacity-100 pt-4 border-t border-rule-soft mt-3"
                         : "max-h-0 opacity-0 pt-0 pointer-events-none"
                     }`}
        >
          <nav className="flex flex-col items-center space-y-4 text-[14.5px] font-medium w-full">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-body hover:text-primary transition-colors w-full text-center py-1.5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col items-center space-y-3 mt-4 w-full pb-2">
            {user ? (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-center gap-2 px-3 py-2">
                  <User className="size-4 text-muted" />
                  <span className="text-[13px] text-body truncate">
                    {user.name ?? user.email ?? "Account"}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-[14px] font-medium text-loss hover:bg-surface border border-transparent hover:border-rule"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setAuthOpen(true);
                }}
                className="block w-full text-center px-4 py-2.5 rounded-full text-[14px] font-semibold bg-primary text-white hover:bg-primary-hover"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
