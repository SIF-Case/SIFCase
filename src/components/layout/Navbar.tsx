"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, User, ChevronDown, Search } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { AuthModal } from "@/components/auth/AuthModal";
import { SearchModal } from "./SearchModal";
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore Funds", href: "/sifs" },
  { label: "Fund Houses", href: "/fund-houses" },
  { label: "Compare", href: "/compare" },
  { label: "SIF 101", href: "/sif-101" },
  { label: "NFO", href: "/nfos" },
  { label: "Insights", href: "/read" },
  { label: "News", href: "/news" },
];
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fundHousesOpen, setFundHousesOpen] = useState(false);
  const [mobileFundHousesOpen, setMobileFundHousesOpen] = useState(false);
  const [brandNames, setBrandNames] = useState<{ brandName: string; companyName_short: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const fundHousesRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

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
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const pathname = usePathname();
  const loading = status === "loading";
  const user = session?.user;

  function isActiveLink(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 flex flex-col items-center px-6 py-[14px] bg-white ${
          mobileOpen ? "rounded-b-[20px]" : ""
        } border-b border-[#e5e7eb] w-full transition-[border-radius] duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between w-full max-w-[1280px] gap-x-8" style={{ height: 36 }}>
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center flex-shrink-0"
            aria-label="Go to home page"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="SIFcase" className="h-8 w-auto" />
          </Link>


          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) =>
              link.label === "Fund Houses" ? (
                <div
                  key={link.label}
                  ref={fundHousesRef}
                  className="relative px-[14px] py-[6px] rounded-[8px] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
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
                  <span className="flex items-center gap-1 text-[14px] text-[#374151]">
                    {link.label}
                    <ChevronDown
                      className={`size-3.5 shrink-0 transition-transform duration-300 ${
                        fundHousesOpen ? "rotate-180 text-[#14b7a3]" : "text-[#374151]"
                      }`}
                    />
                  </span>
                  {fundHousesOpen && (
                    <div
                      className="absolute left-0 top-full mt-2.5 z-30 bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_14px_40px_rgba(11,31,58,0.10)] py-1.5 w-[480px] max-h-80 overflow-y-auto [-webkit-overflow-scrolling:touch]"
                      onMouseLeave={() => setFundHousesOpen(false)}
                    >
                      <Link
                        href={link.href}
                        className="block px-4 py-2 text-[12px] font-semibold text-[#14b7a3] hover:bg-[#f3f4f6]"
                      >
                        All Fund Houses &rarr;
                      </Link>
                      <div className="border-t border-[#e5e7eb] my-1" />
                      {brandNames.length === 0 ? (
                        <div className="px-4 py-2 text-[12px] text-[#64748B]">Loading…</div>
                      ) : (
                        <div className="grid grid-cols-2 px-2 pb-1">
                          {brandNames.map(({ brandName, companyName_short }) => (
                            <Link
                              key={brandName}
                              href={`/fund-house/${encodeURIComponent(
                                brandName.toLowerCase().replace(/\s+/g, "-")
                              )}`}
                              className="flex flex-col px-3 py-2 rounded-[8px] hover:bg-[#f3f4f6] transition-colors"
                            >
                              <span className="text-[13px] font-medium text-[#0d2b3e] leading-tight">
                                {brandName}
                              </span>
                              {companyName_short && (
                                <span className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                                  {companyName_short}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-[14px] py-[6px] rounded-[8px] text-[14px] transition-colors whitespace-nowrap ${
                    isActiveLink(link.href)
                      ? "bg-[#14b7a3] text-white font-[500] hover:bg-[#10a090]"
                      : "text-[#374151] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Desktop right — search + auth */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {/* Search box */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between gap-4 px-[14px] py-[6px] border border-[#e5e7eb] rounded-[8px] bg-[#f9fafb] min-w-[220px] cursor-pointer hover:bg-[#f3f4f6] text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-[#9ca3af] leading-[24px]">
                  Search funds, topics etc
                </span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-white text-[9px] font-semibold text-[#64748B] tracking-wide select-none">
                ⌘K
              </kbd>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-[8px] border border-[#e5e7eb] hover:border-[#14b7a3] text-[#374151] transition-colors"
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="size-5 rounded-full" />
                  ) : (
                    <div className="size-5 rounded-full bg-[#14b7a3] flex items-center justify-center text-white text-[10px] font-bold">
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
                    <div className="absolute right-0 top-full mt-2.5 z-20 w-52 bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_14px_40px_rgba(11,31,58,0.10)] py-1.5">
                      <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
                        <p className="text-[12px] font-semibold text-[#0d2b3e] truncate">
                          {user.name ?? "Account"}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {user.email ?? (session.user as { phone?: string }).phone ?? ""}
                        </p>
                      </div>
                      <Link
                        href={user.isAdmin ? "/admin" : "/dashboard"}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#f3f4f6] transition-colors"
                      >
                        <User className="size-3.5" /> {user.isAdmin ? "Admin Panel" : "My Dashboard"}
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-[#f3f4f6] transition-colors"
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
                className="h-9 rounded-[8px] bg-[#14b7a3] px-4 text-[14px] font-medium text-white hover:bg-[#10a090]"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile search + hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              className="p-2 rounded-full text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6] transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden ${
            mobileOpen
              ? "max-h-[1000px] opacity-100 pt-4 border-t border-[#e5e7eb] mt-3"
              : "max-h-0 opacity-0 pt-0 pointer-events-none"
          }`}
        >
          <nav className="flex flex-col items-center space-y-3 text-[14.5px] font-medium w-full">
            {NAV_LINKS.map((link) => 
              link.label === "Fund Houses" ? (
                <div key={link.label} className="w-full">
                  <button
                    onClick={() => {
                      setMobileFundHousesOpen((v) => !v);
                      loadBrandNames();
                    }}
                    className="flex items-center justify-center gap-1 text-[#374151] hover:text-[#14b7a3] transition-colors w-full text-center py-1.5"
                  >
                    {link.label}
                    <ChevronDown
                      className={`size-3.5 shrink-0 transition-transform duration-300 ${
                        mobileFundHousesOpen ? "rotate-180 text-[#14b7a3]" : "text-[#374151]"
                      }`}
                    />
                  </button>
                  {mobileFundHousesOpen && (
                    <div className="mt-2 px-4 pb-3">
                      <Link
                        href={link.href}
                        className="block px-3 py-2 text-[13px] font-semibold text-[#14b7a3] hover:bg-[#f3f4f6] rounded-lg mb-2"
                        onClick={() => setMobileOpen(false)}
                      >
                        All Fund Houses &rarr;
                      </Link>
                      <div className="border-t border-[#e5e7eb] mb-2" />
                      {brandNames.length === 0 ? (
                        <div className="px-3 py-2 text-[12px] text-[#64748B]">Loading…</div>
                      ) : (
                        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto [-webkit-overflow-scrolling:touch]">
                          {brandNames.map(({ brandName, companyName_short }) => (
                            <Link
                              key={brandName}
                              href={`/fund-house/${encodeURIComponent(
                                brandName.toLowerCase().replace(/\s+/g, "-")
                              )}`}
                              className="flex flex-col px-3 py-2 rounded-lg hover:bg-[#f3f4f6] transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              <span className="text-[13px] font-medium text-[#0d2b3e] leading-tight">
                                {brandName}
                              </span>
                              {companyName_short && (
                                <span className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                                  {companyName_short}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[#374151] hover:text-[#14b7a3] transition-colors w-full text-center py-1.5"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
          <div className="flex flex-col items-center space-y-3 mt-4 w-full pb-2">
            {user ? (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-center gap-2 px-3 py-2">
                  <User className="size-4 text-[#9ca3af]" />
                  <span className="text-[13px] text-[#374151] truncate">
                    {user.name ?? user.email ?? "Account"}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-[14px] font-medium text-red-600 hover:bg-[#f3f4f6] border border-transparent hover:border-[#e5e7eb]"
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
                className="block w-full text-center px-4 py-2.5 rounded-full text-[14px] font-semibold bg-[#14b7a3] text-white hover:bg-[#10a090]"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
