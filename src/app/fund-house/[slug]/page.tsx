export const revalidate = 3600;

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Info, FileText, Users, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { FundHouseCard } from "@/components/sections/FundHouseCard";
import { Providers } from "@/app/providers";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import type { ArticleDoc } from "@/app/read/page";
import {
  getFundHouseBySlug,
  getSIFsWithReturns,
  getTopFunds,
  getTickerNavs,
  getFundDetailsForName,
} from "@/lib/sifData";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fundHouse = await getFundHouseBySlug(slug);
  if (!fundHouse) return { title: "Fund House not found — SIFcase" };
  return {
    title: `${fundHouse.brandName} — SIFcase`,
    description: `${fundHouse.brandName} Specialised Investment Funds — schemes, NAV performance, and news.`,
  };
}

function initialsFor(brandName: string): string {
  const words = brandName.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return brandName.slice(0, 2).toUpperCase();
}

// ── Logo/Avatar component for fund house hero
function FundHouseLogo({
  logoUrl,
  brandName,
}: {
  logoUrl?: string;
  brandName: string;
}) {
  if (logoUrl) {
    return (
      <div className="size-[80px] rounded-[16px] bg-white shrink-0 flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.18)] overflow-hidden p-2.5">
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
    <div className="size-[80px] rounded-[16px] bg-white shrink-0 flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
      <span className="text-[24px] font-extrabold tracking-tight text-[#0F2137]">
        {initialsFor(brandName)}
      </span>
    </div>
  );
}

export default async function FundHousePage({ params }: Props) {
  const { slug } = await params;

  const fundHouse = await getFundHouseBySlug(slug);
  if (!fundHouse) notFound();

  const [sifs, allFunds, tickerNavs] = await Promise.all([
    getSIFsWithReturns("Regular", "Growth", fundHouse.brandName),
    getTopFunds(),
    getTickerNavs(),
  ]);

  const fundNamesInHouse = new Set(sifs.map((s) => s.fundName));
  const houseFunds = allFunds.filter((f) => fundNamesInHouse.has(f.fundName));

  const fundDetailsList = await Promise.all(
    Array.from(fundNamesInHouse).map((name) => getFundDetailsForName(name))
  );
  const managerMap = new Map<string, string>();
  for (const d of fundDetailsList) {
    for (const m of d?.fundManagers ?? []) {
      if (m.name && !managerMap.has(m.name)) managerMap.set(m.name, m.designation ?? "Fund Manager");
    }
  }
  const fundManagers = Array.from(managerMap, ([name, designation]) => ({ name, designation }));

  await connectDB();
  const articles = (await Article.find({
    status: "published",
    category: "Fund Houses",
    subcategory: fundHouse.brandName,
  })
    .sort({ publishedAt: -1 })
    .limit(6)
    .select("title slug excerpt subcategory publishedAt readTime")
    .lean()) as unknown as ArticleDoc[];

  const activeSIFs = houseFunds.length;
  const aumValues = houseFunds.map((f) => f.aum).filter((v): v is number => v !== null);
  const aumFlagship = aumValues.length > 0 ? Math.max(...aumValues) : null;
  const categories = Array.from(new Set(houseFunds.map((f) => f.category)));

  const managerLine =
    fundManagers.length > 0
      ? `The strategies are managed by a team of ${fundManagers.length} fund manager${fundManagers.length === 1 ? "" : "s"}, with portfolio construction grounded in quantitative signals, derivative hedging, and active asset allocation.`
      : `Portfolio construction spans ${categories.join(" and ") || "equity and hybrid"} mandates, managed to SEBI's Specialized Investment Fund framework.`;

  return (
    <Providers funds={houseFunds}>
      <main className="flex flex-col min-h-screen bg-surface">
        <TickerRibbon navItems={tickerNavs} />
        <Navbar />

        {/* HERO */}
        <div style={{ background: "#004C61" }} className="text-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-[50px] pt-7 sm:pt-9 pb-7">
            {/* Back link */}
            <div className="mb-6">
              <Link href="/fund-houses" className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white transition-colors font-medium">
                <ArrowLeft className="size-3.5" /> AMC Directory
              </Link>
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <FundHouseLogo logoUrl={fundHouse.logoUrl} brandName={fundHouse.brandName} />
              <div className="flex flex-col gap-1 pt-1">
                <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] font-extrabold text-white leading-[1.1] tracking-tight">
                  {fundHouse.brandName}
                </h1>
                <span className="text-[13px] text-white/60">{fundHouse.companyName}</span>
                <span className="text-[12px] text-white/45">SEBI-registered AMC</span>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-2 pt-2">
              <span className="text-[13px] text-white/45">
                {fundHouse.schemeCount} scheme{fundHouse.schemeCount === 1 ? "" : "s"}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[13px] text-white/45">
                {activeSIFs} active SIF{activeSIFs === 1 ? "" : "s"}
              </span>
              {categories.length > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-[13px] text-white/45">{categories.join(" & ")} Long-Short</span>
                </>
              )}
              <span className="text-white/20">·</span>
              <span className="text-[13px] text-white/45">Min ₹10,00,000</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1A9E5F17] text-[#4ADE80]">
                <span className="size-1.5 rounded-full bg-[#4ADE80]" /> Active
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.07] border border-white/[0.12] text-white/55">
                SEBI Regulated
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-7 sm:py-9 flex flex-col gap-10 sm:gap-12">
          {/* ABOUT */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Fund House</span>
            </div>
            <h2 className="text-[21px] font-extrabold text-heading tracking-tight">About {fundHouse.brandName}</h2>

            <div className="flex flex-col lg:flex-row items-start gap-4">
              <div className="flex-1 w-full rounded-[14px] border border-rule bg-white overflow-hidden">
                <div className="px-5 py-3.5 border-b border-rule flex items-center justify-between gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-heading">
                    <Info className="size-3.5 text-primary" /> Overview
                  </span>
                  <span className="text-[12px] text-faint">{fundHouse.companyName}</span>
                </div>
                <div className="px-5 py-4 flex flex-col gap-4 text-[15px] leading-[1.7] text-body">
                  {fundHouse.overview ? (
                    <p>{fundHouse.overview}</p>
                  ) : (
                    <>
                      <p>
                        {fundHouse.brandName} is {fundHouse.companyName}&apos;s Specialized Investment Fund platform, offering
                        institutional-grade strategies to eligible investors at a ₹10 lakh entry point. It operates{" "}
                        {fundHouse.schemeCount} scheme{fundHouse.schemeCount === 1 ? "" : "s"} across{" "}
                        {categories.length > 0 ? categories.join(" and ") : "equity and hybrid"} asset classes — designed to
                        generate alpha and manage downside risk in all market conditions.
                      </p>
                      <p>{managerLine}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-[320px] shrink-0 rounded-[14px] border border-rule bg-white overflow-hidden">
                <div className="px-5 py-3.5 border-b border-rule">
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-heading">
                    <FileText className="size-3.5 text-primary" /> Key facts
                  </span>
                </div>
                <div className="px-5 flex flex-col">
                  {[
                    ["AMC", fundHouse.companyName],
                    ["Active SIFs", String(activeSIFs)],
                    ["AUM (Flagship)", aumFlagship !== null ? `₹${aumFlagship.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr` : "—"],
                    ["Min. Investment", "₹10,00,000"],
                  ].map(([label, value], i, arr) => (
                    <div
                      key={label}
                      className={`flex items-start justify-between gap-4 py-[9px] ${i !== arr.length - 1 ? "border-b border-rule" : ""}`}
                    >
                      <span className="text-[14px] text-muted shrink-0 mt-[1px]">{label}</span>
                      <span className="text-[14px] font-semibold text-heading text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {fundManagers.length > 0 && (
              <div className="rounded-[14px] border border-rule bg-white overflow-hidden">
                <div className="px-5 py-3.5 border-b border-rule flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-heading">
                    <Users className="size-3.5 text-primary" /> Fund Managers
                  </span>
                  <span className="text-[12px] text-faint">
                    {fundManagers.length} manager{fundManagers.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="px-5 py-4 flex items-center gap-0 overflow-x-auto">
                  {fundManagers.map((m, i) => (
                    <div key={m.name} className="flex items-center shrink-0">
                      <div className="flex items-center gap-2.5 pr-4" style={{ paddingLeft: i === 0 ? 0 : 16 }}>
                        <div
                          className="size-[38px] rounded-full shrink-0 flex items-center justify-center text-white text-[12px] font-bold"
                          style={{ background: "linear-gradient(135deg, #2E9E8F 0%, #267E72 100%)" }}
                        >
                          {m.name
                            .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, "")
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13.5px] font-semibold text-heading whitespace-nowrap">{m.name}</span>
                          <span className="text-[12px] text-muted whitespace-nowrap">{m.designation}</span>
                        </div>
                      </div>
                      {i !== fundManagers.length - 1 && <div className="w-px h-9 bg-rule shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* FUNDS AVAILABLE */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live SIFs</span>
                </div>
                <h2 className="text-[21px] font-extrabold text-heading tracking-tight">Funds Available</h2>
              </div>
              <Link href="/sifs" className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:text-primary-hover">
                View all other SIFs →
              </Link>
            </div>

            {houseFunds.length === 0 ? (
              <div className="py-16 text-center text-muted text-[15px] rounded-[14px] border border-rule bg-white">
                No schemes found for this fund house.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {houseFunds.map((f) => (
                  <FundHouseCard key={f.schemeCode} fund={f} />
                ))}
              </div>
            )}
          </section>

          {/* NEWS & INSIGHTS */}
          {articles.length > 0 && (
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Latest Updates</span>
                  </div>
                  <h2 className="text-[21px] font-extrabold text-heading tracking-tight">News &amp; Insights</h2>
                </div>
                <Link href={`/news?brand=${encodeURIComponent(fundHouse.brandName)}`} className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary hover:text-primary-hover">
                  View all news →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((a) => (
                  <Link
                    key={String(a._id)}
                    href={`/news/${a.slug}`}
                    className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow"
                  >
                    <div className="flex flex-col flex-1">
                      {/* Category & Read Time */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary truncate max-w-[140px]">
                          {a.subcategory || "Fund Houses"}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-faint">
                          <span className="w-3 h-3" />
                          {a.readTime || 3} min
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
                        {a.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">
                        {a.excerpt || "Click to read the full article."}
                      </p>

                      {/* Footer: Date & Read Arrow */}
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-[11px] text-faint">
                          {a.publishedAt
                            ? new Date(a.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                            : ""}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all">
                          Read →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* NEWSLETTER */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 rounded-[14px] px-6 py-5"
            style={{ background: "linear-gradient(92deg, #0F2137 0%, #1C3A5A 100%)" }}
          >
            <div className="flex-1 flex flex-col gap-0.5">
              <h3 className="text-[15px] font-bold text-white">Stay Updated on {fundHouse.brandName} &amp; SIF Markets</h3>
              <p className="text-[12.5px] text-white/45">NAV alerts, monthly performance reports, and SIF strategy updates — free.</p>
            </div>
            <form className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="h-10 w-full sm:w-[200px] px-3.5 rounded-[6px] border border-white/[0.15] bg-white/10 text-[13px] text-white placeholder:text-white/35 outline-none"
              />
              <button
                type="submit"
                className="h-10 shrink-0 px-4 rounded-[6px] text-[13px] font-semibold text-white"
                style={{ background: "#2E9E8F" }}
              >
                Subscribe →
              </button>
            </form>
          </div>

          {/* DISCLAIMER */}
          <div className="flex items-start gap-2.5 rounded-[10px] border border-rule bg-surface px-4 py-3">
            <span className="text-[15px] leading-none pt-0.5">⚠️</span>
            <p className="text-[11.5px] leading-[1.6] text-muted">
              Content issued by Aureva Capital Private Limited for general information and educational purposes only. It
              does not constitute financial, tax, legal, or investment advice. Investments in SIFs involve capital risk.
              Please read all scheme documents carefully. Past performance is not indicative of future results.{" "}
              <Link href="/disclaimer" className="font-semibold text-primary hover:text-primary-hover">
                Read full disclaimer →
              </Link>
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </Providers>
  );
}
