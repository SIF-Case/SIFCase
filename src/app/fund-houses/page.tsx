/**
 * /fund-houses — listing page for all fund houses.
 *
 * Displays all AMCs with their branding (logo + overview) managed via the
 * admin panel. Falls back to initials avatar when no logo is configured.
 */
export const revalidate = 3600;

import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Providers } from "@/app/providers";
import { getTopFunds, getTickerNavs } from "@/lib/sifData";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import FundHouse from "@/models/FundHouse";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fund Houses — SIFcase",
  description:
    "Browse all AMCs offering Specialised Investment Funds. Compare schemes, AUM, strategies, and performance across fund houses.",
};

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function brandNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

interface FundHouseSummary {
  brandName: string;
  companyName: string;
  schemeCount: number;
  logoUrl: string;
  overview: string;
}

async function getFundHouses(): Promise<FundHouseSummary[]> {
  await connectDB();
  const db = mongoose.connection.db!;

  const [rows, branding] = await Promise.all([
    db
      .collection("sifschemes")
      .aggregate([
        { $match: { brandName: { $exists: true, $ne: "" }, plan: "Regular", option: "Growth" } },
        {
          $group: {
            _id: "$brandName",
            companyName: { $first: "$companyName" },
            schemeCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    FundHouse.find({}).lean(),
  ]);

  const brandingMap = new Map(branding.map((b) => [b.brandName, b]));

  return rows.map((r) => {
    const b = brandingMap.get(r._id as string);
    return {
      brandName: r._id as string,
      companyName: (r.companyName as string) || (r._id as string),
      schemeCount: r.schemeCount as number,
      logoUrl: b?.logoUrl ?? "",
      overview: b?.overview ?? "",
    };
  });
}

// ── Logo/Avatar component (server-rendered, with client error boundary via CSS)
function FundLogo({
  logoUrl,
  brandName,
}: {
  logoUrl: string;
  brandName: string;
}) {
  if (logoUrl) {
    return (
      <div className="size-20 rounded-[14px] bg-white border border-rule flex items-center justify-center overflow-hidden shrink-0 p-2">
        <Image
          src={logoUrl}
          alt={brandName}
          width={80}
          height={80}
          className="object-contain max-w-full max-h-full"
          style={{ width: 'auto', height: 'auto' }}
        />
      </div>
    );
  }
  return (
    <div className="size-20 rounded-[14px] bg-[#0C3B54] flex items-center justify-center shrink-0 group-hover:bg-[#0E9F8E] transition-colors">
      <span className="text-[18px] font-extrabold text-white">
        {initialsFor(brandName)}
      </span>
    </div>
  );
}

export default async function FundHousesPage() {
  const [fundHouses, allFunds, tickerNavs] = await Promise.all([
    getFundHouses(),
    getTopFunds(),
    getTickerNavs(),
  ]);

  // Compute AUM per brand from allFunds
  const aumByBrand = new Map<string, number>();
  for (const f of allFunds) {
    if (f.aum !== null) {
      const slug = brandNameToSlug(f.amc);
      aumByBrand.set(slug, (aumByBrand.get(slug) ?? 0) + f.aum);
    }
  }

  return (
    <Providers funds={allFunds}>
      <main className="flex flex-col min-h-screen bg-surface">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />

        {/* Hero */}
        <div className="bg-[#0C3B54] text-white border-b border-white/[0.06]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-8 sm:py-10">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
              All AMCs
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-extrabold text-white leading-tight tracking-tight">
              Fund Houses
            </h1>
            <p className="text-[14px] text-white/50 mt-2 max-w-xl">
              {fundHouses.length} AMCs with active Specialised Investment Funds.
              Click any card to explore their schemes.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-10 py-8 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fundHouses.map((fh) => {
              const slug = brandNameToSlug(fh.brandName);
              return (
                <Link
                  key={fh.brandName}
                  href={`/fund-house/${encodeURIComponent(slug)}`}
                  className="group flex flex-col bg-white rounded-[18px] border border-rule p-6 shadow-card hover:shadow-premium hover:border-rule-strong transition-all"
                >
                  {/* Logo + Info + Scheme Count */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {/* Left: Logo + Name + Company */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <FundLogo logoUrl={fh.logoUrl} brandName={fh.brandName} />
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="text-[16px] font-bold text-heading leading-tight group-hover:text-primary transition-colors mb-1">
                          {fh.brandName}
                        </div>
                        <div className="text-[12px] text-muted leading-snug">
                          {fh.companyName}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          SEBI-registered AMC
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Scheme Count */}
                    <div className="text-right shrink-0">
                      <div className="text-[24px] font-extrabold text-primary nums leading-none">
                        {fh.schemeCount}
                      </div>
                      <div className="text-[11px] text-muted mt-1 uppercase tracking-wide font-semibold">
                        Fund{fh.schemeCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Overview text (if set) */}
                  {fh.overview && (
                    <p className="text-[13px] text-body leading-relaxed line-clamp-2">
                      {fh.overview}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>

          {fundHouses.length === 0 && (
            <div className="py-20 text-center text-muted text-[15px]">
              No fund houses found. Data may still be loading.
            </div>
          )}
        </div>

        <Footer />
      </main>
    </Providers>
  );
}
