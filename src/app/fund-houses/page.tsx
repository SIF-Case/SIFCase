/**
 * /fund-houses — listing page for all fund houses.
 *
 * Previously the Navbar linked here but no page existed, causing a hard
 * browser reload. This page renders all fund houses with clickable cards
 * that navigate client-side to /fund-house/[slug].
 */
export const revalidate = 3600;

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { Providers } from "@/app/providers";
import { getTopFunds, getTickerNavs } from "@/lib/sifData";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
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
  activeCount: number;
}

async function getFundHouses(): Promise<FundHouseSummary[]> {
  await connectDB();
  const db = mongoose.connection.db!;
  const rows = await db
    .collection("sifschemes")
    .aggregate([
      { $match: { brandName: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$brandName",
          companyName: { $first: "$companyName" },
          schemeCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$plan", "Regular"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return rows.map((r) => ({
    brandName: r._id as string,
    companyName: (r.companyName as string) || (r._id as string),
    schemeCount: r.schemeCount as number,
    activeCount: r.activeCount as number,
  }));
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
                  className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-all"
                >
                  {/* Logo avatar + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-[12px] bg-[#0C3B54] flex items-center justify-center shrink-0 group-hover:bg-[#0E9F8E] transition-colors">
                      <span className="text-[14px] font-extrabold text-white">
                        {initialsFor(fh.brandName)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-heading leading-tight truncate group-hover:text-primary transition-colors">
                        {fh.brandName}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 truncate">
                        {fh.companyName}
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 flex-wrap text-[12px] text-muted border-t border-rule pt-3 mt-auto">
                    <span className="font-semibold text-heading">
                      {fh.schemeCount} scheme{fh.schemeCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-rule">·</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-[#1A9E5F]" />
                      Active
                    </span>
                    <span className="text-rule">·</span>
                    <span>Min ₹10L</span>
                  </div>
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
