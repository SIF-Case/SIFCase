import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { extractSchemeCode, fundSlug, fundHref } from "@/lib/slugify";
import {
  ShieldCheck, TrendingUp, MinusCircle, ExternalLink,
  CheckCircle2, XCircle, ArrowLeftRight, Compass, BarChart2,
  Building2, TrendingDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FundDetailPanel } from "@/components/sections/FundDetailPanel";
import { NavActionCard } from "@/components/sections/NavActionCard";
import { getFundDetail, getFundDetailsForName, getTopFunds, type PeriodKey } from "@/lib/sifData";
import { getCategoryAverageSeries } from "@/lib/categoryAverages";
import { FundDetailsSection } from "@/components/sections/FundDetailsSection";
import { SEBIRiskometer } from "@/components/ui/RiskMeter";
import { FundTabs } from "@/components/ui/FundTabs";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ variant?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const schemeCode = extractSchemeCode(code);
  if (!schemeCode) return { title: "Fund not found — SIFcase" };
  const fund = await getFundDetail(schemeCode);
  if (!fund) return { title: "Fund not found — SIFcase" };
  return {
    title: `${fund.fundName} — SIFcase`,
    description: `${fund.strategy} SIF by ${fund.amc}. Latest NAV ₹${fund.nav.toFixed(4)} as of ${fund.navDate}. Source-verified returns and risk metrics.`,
    alternates: { canonical: fundHref(fund.fundName, fund.schemeCode) },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────


function fmtPct(v: number | null, decimals = 2): string | null {
  if (v === null) return null;
  return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
}

function fmtInr(n: number | null): string {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtCr(n: number | null): string {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

function safeAvg(vals: (number | null)[]): number | null {
  const valid = vals.filter((x): x is number => x !== null);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function formatLaunchDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatLaunchMonth(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ── Category Context Metric Card ──────────────────────────────────────────────

function MetricCard({
  label,
  value,
  catAvg,
  valueColor,
}: {
  label: string;
  value: string | null;
  catAvg: string | null;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E2E8EE] p-4 flex flex-col gap-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#6B8299]">{label}</div>
      <div className={`text-[22px] font-bold leading-none ${valueColor ?? "text-[#0F1C28]"}`}>
        {value ?? "—"}
      </div>
      {catAvg && (
        <div className="text-[11px] text-[#6B8299]">Cat avg: {catAvg}</div>
      )}
    </div>
  );
}

// ── Horizontal Comparison Bar ─────────────────────────────────────────────────

function ComparisonRow({
  label,
  value,
  maxAbs,
  isThisFund,
}: {
  label: string;
  value: number | null;
  maxAbs: number;
  isThisFund?: boolean;
}) {
  const pct = value !== null && maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
  const positive = value !== null ? value >= 0 : true;

  return (
    <div className="flex items-center gap-3 py-[9px] border-b border-[#E2E8EE] last:border-0">
      <div className="w-[100px] sm:w-[170px] shrink-0">
        <span className={`text-[13px] truncate block ${isThisFund ? "font-semibold text-[#0F1C28]" : "font-medium text-[#3D5166]"}`}>
          {label}
        </span>
      </div>
      {value !== null ? (
        <>
          <div className="flex-1 h-[6px] bg-[#E2E8EE] rounded-[3px] overflow-hidden">
            <div
              className="h-full rounded-[3px] transition-all"
              style={{
                width: `${pct}%`,
                background: !positive ? "#F87171" : isThisFund ? "#0E9F8E" : "rgba(14,159,142,0.55)",
              }}
            />
          </div>
          <div className="w-[56px] shrink-0 text-right">
            <span className={`text-[13px] font-semibold ${positive ? "text-[#1A9E5F]" : "text-[#F87171]"}`}>
              {positive ? "+" : ""}{value.toFixed(2)}%
            </span>
          </div>
        </>
      ) : (
        <span className="text-[12px] text-[#6B8299] flex-1">—</span>
      )}
    </div>
  );
}

// ── Info Row (sidebar / key facts) ────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-[9px] border-b border-[#E2E8EE] last:border-0">
      <span className="text-[12.5px] text-[#6B8299] font-normal">{label}</span>
      <span className="text-[12.5px] text-[#0F1C28] font-medium text-right">{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default async function FundDetailPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { variant } = await searchParams;
  const isReinvest = variant === "reinvest";
  const schemeCode = extractSchemeCode(code);
  if (!schemeCode) notFound();
  const fund = await getFundDetail(schemeCode);
  if (!fund) notFound();

  // Canonicalize old bare-code URLs (/sifs/sif-105) and any non-canonical slug
  // to the keyword-rich fund-name-based URL for SEO — permanent (308) redirect
  // preserves link equity from already-indexed/bookmarked old URLs.
  const canonicalSlug = fundSlug(fund.fundName, fund.schemeCode);
  if (code.toLowerCase() !== canonicalSlug) {
    const qs = variant ? `?variant=${variant}` : "";
    permanentRedirect(`/sifs/${canonicalSlug}${qs}`);
  }

  const fundDetails = await getFundDetailsForName(fund.fundName).catch(() => null);
  const allFunds = await getTopFunds();

  const PERIOD_KEYS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];
  const categoryAvg = PERIOD_KEYS.reduce((acc, p) => {
    acc[p] = getCategoryAverageSeries(allFunds, fund.strategy, p);
    return acc;
  }, {} as Record<PeriodKey, { data: number[]; dates: string[] } | null>);

  // 1-day NAV change
  const navHistory = fund.navHistory;
  const prevNav = navHistory.length >= 2 ? navHistory[navHistory.length - 2].nav : null;
  const navChange = prevNav !== null ? fund.nav - prevNav : null;
  const navChangePct = prevNav !== null && prevNav !== 0 ? (navChange! / prevNav) * 100 : null;
  const navChangePositive = navChange !== null ? navChange >= 0 : true;

  const fundAgeYears =
    (new Date(fund.navDate).getTime() - new Date(fund.launchDate).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  const siLabel = fundAgeYears > 1 ? "Since Inception (CAGR)" : "Since Inception";

  const reinvestVariant = fund.variants.find(
    (v) => v.option === "IDCW Reinvestment" && v.schemeCode === fund.schemeCode
  );
  const displayIsin = isReinvest && reinvestVariant?.isin ? reinvestVariant.isin : fund.isin;

  // ── Category metrics ────────────────────────────────────────────────────────
  const catFunds = allFunds.filter((f) => f.strategy === fund.strategy);
  const catCount = catFunds.length;

  const cat1MAvg = safeAvg(catFunds.map((f) => f.returns["1M"]));
  const catSharpeAvg = safeAvg(catFunds.map((f) => f.sharpes["SI"]));
  const catDrawdownAvg = safeAvg(catFunds.map((f) => f.drawdowns["SI"]));

  // ── Category comparison bars ────────────────────────────────────────────────
  const catFundsWith1M = catFunds
    .filter((f) => f.returns["1M"] !== null)
    .sort((a, b) => b.returns["1M"]! - a.returns["1M"]!);

  const isThisFundInList = catFundsWith1M.some((f) => f.schemeCode === fund.schemeCode);
  const topPeers = catFundsWith1M.filter((f) => f.schemeCode !== fund.schemeCode).slice(0, 3);

  type CompBar = { label: string; value: number | null; isThisFund?: boolean; isCatAvg?: boolean };
  const compBars: CompBar[] = [];
  if (isThisFundInList) {
    compBars.push({ label: "This fund", value: fund.returns["1M"], isThisFund: true });
  }
  topPeers.forEach((f) => {
    const shortName = f.fundName.replace(/\b(SIF|Fund|Specialised|Specialized)\b/gi, "").trim().slice(0, 22);
    compBars.push({ label: shortName, value: f.returns["1M"] });
  });
  if (cat1MAvg !== null) {
    compBars.push({ label: "Category average", value: cat1MAvg, isCatAvg: true });
  }
  const maxAbs1M = Math.max(...compBars.map((b) => Math.abs(b.value ?? 0)), 0.01);

  // ── RETURN_ROWS for hero strip ──────────────────────────────────────────────
  const heroReturns = [
    { label: "1M", value: fund.returns["1M"], catAvg: cat1MAvg },
    { label: "3M", value: fund.returns["3M"], catAvg: safeAvg(catFunds.map((f) => f.returns["3M"])) },
    { label: "6M", value: fund.returns["6M"], catAvg: safeAvg(catFunds.map((f) => f.returns["6M"])) },
    { label: "1Y", value: fund.returns["1Y"], catAvg: safeAvg(catFunds.map((f) => f.returns["1Y"])) },
    { label: "SI", value: fund.returns.SI, catAvg: null, note: "Since inception" },
  ];

  // ── Variant switcher ────────────────────────────────────────────────────────
  const hasVariants = fund.variants.length > 1;

  // ── Strategy Explainers ─────────────────────────────────────────────────────
  const STRATEGY_EXPLAINERS: Record<string, { what: string; how: string; when: string; risk: string }> = {
    "Long-Short": {
      what: "Combines a directional long book (stocks expected to rise) with a short book (stocks expected to fall) via derivatives. The goal is to generate alpha from both rising and falling individual securities, independent of market direction.",
      how: "The manager builds a long portfolio of high-conviction ideas while simultaneously shorting lower-conviction or overvalued stocks using futures or options. Net long exposure is typically 30–80% of AUM.",
      when: "Performs best in stock-picker markets with high dispersion — when different stocks are moving in different directions regardless of the index.",
      risk: "Short book can cause amplified losses if shorted stocks rise sharply. Strategy is dependent on manager skill in selecting both longs and shorts correctly.",
    },
    "Market Neutral": {
      what: "Aims for near-zero correlation to the broad market by maintaining equal long and short exposure. Returns come from the spread between individual stock performance, not from market direction.",
      how: "Pairs of related securities are traded simultaneously — long on undervalued, short on overvalued. The portfolio is continuously rebalanced to keep market beta near zero.",
      when: "Most effective in low-return, sideways, or high-volatility markets where broad market direction is unclear.",
      risk: "Returns are capped by the size of available spreads. High transaction costs. Liquidity of the short side can be a constraint.",
    },
    "Multi-Asset": {
      what: "Dynamically allocates across multiple asset classes — equity, debt, gold, REITs, and international assets — based on macro conditions, valuations, and momentum signals.",
      how: "The fund manager shifts allocations between asset classes as market conditions change. Some funds use a rules-based model; others rely on discretionary views.",
      when: "Designed to perform across market cycles by reducing concentration in any single asset class.",
      risk: "Returns depend heavily on tactical allocation calls being correct. Currency risk on international allocations. Rebalancing costs can erode returns.",
    },
    "Event Driven": {
      what: "Targets corporate events — M&A transactions, IPOs, open offers, buybacks, delistings, spin-offs, and restructurings — where price dislocations create temporary arbitrage opportunities.",
      how: "The fund takes positions before and after corporate events, capturing the spread between current price and expected post-event value. Positions are typically closed once the event completes.",
      when: "Strong corporate activity cycles with active M&A, regulatory approvals, and capital market transactions create the most opportunities.",
      risk: "Deal-break risk: if a merger falls through or an offer is withdrawn, the position can suffer sudden large losses. Events can also take longer than expected to complete.",
    },
    Quant: {
      what: "Uses systematic, model-driven signals to construct the portfolio. Factor exposures — momentum, value, quality, low-volatility — are combined mathematically rather than through qualitative judgement.",
      how: "Algorithms screen the investable universe daily, rank securities by factor scores, and rebalance to maintain target exposures. Some strategies also use machine learning signals.",
      when: "Factor strategies work well in trending markets where momentum, value, or quality themes are rewarded consistently over time.",
      risk: "Factor drawdowns can persist for extended periods. Crowding in popular factors can cause simultaneous losses when investors de-risk. Model risk if market dynamics change.",
    },
    Arbitrage: {
      what: "Captures the spread between cash prices and futures prices of the same stock or index. Returns are similar to short-term debt instruments but taxed as equity.",
      how: "The fund simultaneously buys stock in the cash market and sells an equivalent futures contract at a higher price. The difference is locked in as return at expiry.",
      when: "Most effective when futures roll yields are elevated — typically in volatile or bullish markets where futures trade at a significant premium to spot.",
      risk: "Returns compress when futures premiums shrink. Liquidity risk in individual stock futures. Rollover costs can eat into returns in low-premium environments.",
    },
  };
  const explainer = STRATEGY_EXPLAINERS[fund.strategy] ?? null;

  const TAXATION =
    fund.category === "Equity"
      ? [
          { type: "Short-Term Capital Gain (< 12 months)", rule: "Taxed at 20% as per equity taxation rules." },
          { type: "Long-Term Capital Gain (> 12 months)", rule: "Taxed at 12.5% on gains exceeding ₹1.25 lakh per year." },
          { type: "Dividend / IDCW", rule: "Taxed at applicable slab rate as ordinary income." },
        ]
      : [
          { type: "Short-Term Capital Gain (< 24 months)", rule: "Taxed at applicable slab rate." },
          { type: "Long-Term Capital Gain (> 24 months)", rule: "Taxed at 12.5% without indexation." },
          { type: "Dividend / IDCW", rule: "Taxed at applicable slab rate as ordinary income." },
        ];

  // ── Fund manager initials ───────────────────────────────────────────────────
  const amcInitial = fund.amc
    .split(" ")
    .map((w) => w[0])
    .slice(0, 1)
    .join("")
    .toUpperCase();

  return (
    <>
      <Navbar />

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E2E8EE]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10">
          <div className="flex items-center gap-1.5 py-[9px] text-[12px] overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-[#6B8299] hover:text-[#3D5166] transition-colors shrink-0">Home</Link>
            <span className="text-[#CCD5DD] text-[14px] shrink-0">›</span>
            <Link href="/sifs" className="text-[#6B8299] hover:text-[#3D5166] transition-colors shrink-0">All SIFs</Link>
            <span className="text-[#CCD5DD] text-[14px] shrink-0">›</span>
            <span className="text-[#3D5166] font-medium truncate">{fund.fundName}</span>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0C3B54] border-b border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-6 sm:py-7">

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-[7px] px-3 py-1 rounded-full border border-white/[0.14] bg-white/[0.08]">
              {fund.logoUrl ? (
                <div className="w-5 h-5 rounded-[4px] bg-white flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                  <Image
                    src={fund.logoUrl}
                    alt={fund.amc}
                    width={20}
                    height={20}
                    className="object-contain max-w-full max-h-full"
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-[4px] bg-[#0E9F8E] flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold leading-none">{amcInitial}</span>
                </div>
              )}
              <span className="text-[11px] font-medium text-white/80">{fund.amc}</span>
            </div>
            <div className="flex items-center gap-[7px] px-3 py-1 rounded-full border border-[rgba(26,158,95,0.25)] bg-[rgba(26,158,95,0.09)]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#1A9E5F] inline-block" />
              <span className="text-[11px] font-semibold text-[#1A9E5F]">Active</span>
            </div>
            <div className="px-[9px] py-[3px] rounded-full border border-[rgba(14,159,142,0.25)] bg-[rgba(14,159,142,0.09)]">
              <span className="text-[11px] font-semibold text-[#0E9F8E]">{fund.category}</span>
            </div>
            <div className="px-[9px] py-[3px] rounded-full border border-white/[0.12] bg-white/[0.07]">
              <span className="text-[10px] font-semibold text-white/65">{fund.strategy}</span>
            </div>
          </div>

          {/* Fund name */}
          <h1 className="text-[20px] sm:text-[24px] font-extrabold text-white leading-[1.2] tracking-[-0.4px] pt-1 mb-2">
            {fund.fundName}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/50 mb-6">
            {displayIsin && <span>{displayIsin}</span>}
            {displayIsin && <span className="text-white/20">·</span>}
            <span>Launched {formatLaunchDate(fund.launchDate)}</span>
          </div>

          {/* Variant switcher */}
          {hasVariants && (
            <div className="mb-6">
              <div className="text-[9px] font-semibold uppercase tracking-[0.9px] text-white/30 mb-2">
                Plan &amp; Option
              </div>
              <div className="flex flex-wrap gap-2">
                {fund.variants.map((v) => {
                  const key = `${v.schemeCode}-${v.option}`;
                  const isVirtualReinvest = v.option === "IDCW Reinvestment";
                  const isCurrent = isVirtualReinvest
                    ? isReinvest && v.schemeCode === fund.schemeCode
                    : !isReinvest && v.schemeCode === fund.schemeCode && v.option === fund.option;
                  const href = isVirtualReinvest
                    ? `${fundHref(fund.fundName, v.schemeCode)}?variant=reinvest`
                    : fundHref(fund.fundName, v.schemeCode);
                  return isCurrent ? (
                    <span key={key} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#0E9F8E] text-white border border-[#0E9F8E]">
                      {v.option}
                    </span>
                  ) : (
                    <Link
                      key={key}
                      href={href}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/60 border border-white/15 hover:bg-white/20 hover:text-white transition-colors"
                    >
                      {v.option}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Returns strip */}
          <div className="pt-7 border-t border-white/[0.08]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-5">
              Returns — source: AMFI NAV history
            </div>
            <div className="flex flex-wrap gap-y-5 gap-x-6 sm:gap-x-8">
              {heroReturns.map((r, i) => {
                const positive = r.value !== null ? r.value >= 0 : true;
                const catPositive = r.catAvg !== null ? r.catAvg >= 0 : true;
                return (
                  <div
                    key={r.label}
                    className={`pr-6 sm:pr-8 ${i < heroReturns.length - 1 ? "sm:border-r border-white/[0.08]" : ""}`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2.5">{r.label}</div>
                    {r.value !== null ? (
                      <div className={`text-[22px] font-bold leading-none tracking-tight ${positive ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
                        {positive ? "+" : ""}{r.value.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="text-[18px] text-white/30 leading-none">—</div>
                    )}
                    {r.note ? (
                      <div className="text-[11px] text-white/40 mt-2">{r.note}</div>
                    ) : r.catAvg !== null ? (
                      <div className={`text-[11.5px] mt-2 ${catPositive ? "text-white/50" : "text-white/50"}`}>
                        vs cat avg {catPositive ? "+" : ""}{r.catAvg.toFixed(1)}%
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────────── */}
      <div className="bg-[#F4F6F8] min-h-screen overflow-x-hidden">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:justify-between">

            {/* ── LEFT: Main content ────────────────────────────────────── */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[calc(100%-364px)] flex flex-col gap-6">

              {/* ── Category Context ─────────────────────────────────────── */}
              <section>
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#6B8299] mb-2">
                  Category context
                </div>
                <h2 className="text-[16px] font-bold text-[#0E2A47] mb-4">Performance vs. category</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    label="1M Return"
                    value={fmtPct(fund.returns["1M"])}
                    catAvg={cat1MAvg !== null ? `${cat1MAvg >= 0 ? "+" : ""}${cat1MAvg.toFixed(1)}%` : null}
                    valueColor={fund.returns["1M"] !== null ? (fund.returns["1M"] >= 0 ? "text-[#1A9E5F]" : "text-[#F87171]") : undefined}
                  />
                  <MetricCard
                    label="Sharpe Ratio"
                    value={fund.sharpes["SI"] !== null ? fund.sharpes["SI"]!.toFixed(2) : null}
                    catAvg={catSharpeAvg !== null ? catSharpeAvg.toFixed(1) : null}
                  />
                  <MetricCard
                    label="Max Drawdown"
                    value={fund.drawdowns["SI"] !== null ? `${fund.drawdowns["SI"]!.toFixed(2)}%` : null}
                    catAvg={catDrawdownAvg !== null ? `${catDrawdownAvg.toFixed(1)}%` : null}
                    valueColor={fund.drawdowns["SI"] !== null ? (fund.drawdowns["SI"]! < 0 ? "text-[#F87171]" : "text-[#1A9E5F]") : undefined}
                  />
                  <MetricCard
                    label="Volatility"
                    value={fund.volatilities["SI"] !== null ? `${fund.volatilities["SI"]!.toFixed(2)}%` : null}
                    catAvg={null}
                  />
                </div>
              </section>

              {/* ── Performance tabs card ─────────────────────────────────── */}
              <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden">
                <FundTabs
                  performance={
                    <div className="p-5">
                      <FundDetailPanel
                        fund={fund}
                        categoryAvg={categoryAvg}
                        categoryLabel={fund.strategy}
                      />
                    </div>
                  }
                  risk={
                    <div className="divide-y divide-[#E2E8EE]">
                      {[
                        {
                          label: "Sharpe Ratio (SI)",
                          value: fund.sharpes["SI"] !== null ? fund.sharpes["SI"]!.toFixed(2) : null,
                          note: "Risk-adjusted return per unit of volatility.",
                        },
                        {
                          label: "Volatility (SI)",
                          value: fund.volatilities["SI"] !== null ? `${fund.volatilities["SI"]!.toFixed(2)}%` : null,
                          note: "Annualised standard deviation of daily returns.",
                        },
                        {
                          label: "Max Drawdown (SI)",
                          value: fund.drawdowns["SI"] !== null ? `${fund.drawdowns["SI"]!.toFixed(2)}%` : null,
                          note: "Peak-to-trough decline in NAV since inception.",
                        },
                        {
                          label: "Max Drawdown (3M)",
                          value: fund.drawdowns["3M"] !== null ? `${fund.drawdowns["3M"]!.toFixed(2)}%` : null,
                          note: "Peak-to-trough in last 3 months.",
                        },
                      ].map(({ label, value, note }) => (
                        <div key={label} className="px-5 py-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[13px] font-medium text-[#3D5166]">{label}</div>
                            <div className="text-[11px] text-[#6B8299] mt-0.5">{note}</div>
                          </div>
                          {value !== null ? (
                            <span className="text-[16px] font-bold text-[#0F1C28] shrink-0 tabular-nums">{value}</span>
                          ) : (
                            <span className="text-[12px] text-[#6B8299] shrink-0">Insufficient history</span>
                          )}
                        </div>
                      ))}
                      {/* SEBI Riskometer */}
                      {fundDetails?.riskBand != null && (
                        <div className="p-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#6B8299] mb-4">SEBI Riskometer</div>
                          <div className={`grid gap-6 ${fundDetails.benchmarkRiskBand != null ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
                            <SEBIRiskometer level={fundDetails.riskBand} title={fund.fundName} />
                            {fundDetails.benchmarkRiskBand != null && (
                              <SEBIRiskometer
                                level={fundDetails.benchmarkRiskBand}
                                title={fundDetails.benchmarkName || "Benchmark"}
                                subtitle="as applicable"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  }
                  portfolio={
                    fundDetails && (fundDetails.assetAllocation?.length > 0 || fundDetails.topHoldings?.length > 0) ? (
                      <div className="p-1">
                        <FundDetailsSection details={fundDetails} />
                      </div>
                    ) : undefined
                  }
                  manager={
                    fundDetails?.fundManagers?.length ? (
                      <div className="divide-y divide-[#E2E8EE]">
                        {fundDetails.fundManagers.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-4">
                            <div className="size-10 rounded-full bg-[#0E9F8E]/10 flex items-center justify-center shrink-0">
                              <span className="text-[13px] font-bold text-[#0E9F8E]">
                                {m.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                              </span>
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-[#0F1C28]">{m.name}</div>
                              <div className="text-[11px] text-[#6B8299] mt-0.5">{m.designation || "Fund Manager"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : undefined
                  }
                  documents={
                    fundDetails?.factsheets?.length ? (
                      <div className="p-5 grid sm:grid-cols-2 gap-3">
                        {fundDetails.factsheets.map((f, i) => (
                          <a
                            key={i}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-[#F8FAFB] border border-[#E2E8EE] rounded-[12px] hover:border-[#0E9F8E] transition-colors group"
                          >
                            <div className="size-9 rounded-[8px] bg-[#0E9F8E]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0E9F8E]/20 transition-colors">
                              <ExternalLink className="size-4 text-[#0E9F8E]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-semibold text-[#0F1C28] truncate">{f.filename}</div>
                              {f.uploadedAt && (
                                <div className="text-[10px] text-[#6B8299] mt-0.5">
                                  {new Date(f.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </div>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : undefined
                  }
                />
              </div>

              <div className="block lg:hidden">
                <NavActionCard
                  fund={fund}
                  navChange={navChange}
                  navChangePositive={navChangePositive}
                  navChangePct={navChangePct}
                  fundDetails={fundDetails}
                />
              </div>

              {/* ── Category comparison ───────────────────────────────────── */}
              {compBars.length > 0 && (
                <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-4 border-b border-[#E2E8EE]">
                    <div className="flex items-center gap-2">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-[#0E9F8E]">
                        <rect x="1" y="1" width="5" height="13" rx="1" fill="currentColor" opacity="0.3" />
                        <rect x="9" y="4" width="5" height="10" rx="1" fill="currentColor" />
                      </svg>
                      <span className="text-[14px] font-bold text-[#0E2A47]">Category comparison — 1M returns</span>
                    </div>
                    <span className="text-[12px] text-[#6B8299]">{fund.strategy} · {catCount} funds</span>
                  </div>
                  <div className="px-5 py-2">
                    {compBars.map((bar, i) => (
                      <ComparisonRow
                        key={i}
                        label={bar.label}
                        value={bar.value}
                        maxAbs={maxAbs1M}
                        isThisFund={bar.isThisFund}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Key facts ─────────────────────────────────────────────── */}
              <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8EE]">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#0E9F8E" strokeWidth="1.17" />
                      <path d="M7 9.33V7M7 4.67H7.006" stroke="#0E9F8E" strokeWidth="1.17" strokeLinecap="round" />
                    </svg>
                    <span className="text-[14px] font-bold text-[#0E2A47]">Key facts</span>
                  </div>
                  <span className="text-[10.5px] text-[#6B8299]">from KIM / ISID</span>
                </div>
                <div className="px-4">
                  <InfoRow label="Min. investment" value={fmtInr(fundDetails?.minInvestment ?? null)} />
                  <InfoRow label="Expense ratio" value={fund.expenseRatio !== null ? `${fund.expenseRatio}%` : (fundDetails?.terMax || "—")} />
                  <InfoRow label="AUM" value={fmtCr(fund.aum ?? fundDetails?.aumCurrent ?? null)} />
                  <InfoRow label="Inception date" value={formatLaunchMonth(fund.launchDate)} />
                  <InfoRow label="Exit load" value={fundDetails?.exitLoad ?? "—"} />
                  <InfoRow label="Benchmark" value={fund.benchmark ?? fundDetails?.benchmarkName ?? "—"} />
                </div>
              </div>

              {/* ── Speak to RM ───────────────────────────────────────────── */}
              <div className="bg-[#0C3B54] rounded-[14px] border border-white/[0.08] p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="size-10 rounded-full bg-[#0E9F8E] flex items-center justify-center shrink-0">
                    <span className="text-white text-[13px] font-bold">SK</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">Speak to your Relationship Manager</div>
                    <div className="text-[12px] text-white/50 mt-0.5">
                      Get details on this fund or understand if it suits your portfolio
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0E9F8E] text-white text-[13px] font-semibold hover:bg-[#0a8577] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.315 13.132a1 1 0 0 1 .244-.894C3.472 11.023 4 9.5 4 9A5 5 0 1 1 14 9c0 .5.528 2.023 1.441 3.238a1 1 0 0 1-.39 1.558l-2.56.749a1 1 0 0 0-.487.35l-.266.35a1.5 1.5 0 0 1-2.476 0l-.266-.35a1 1 0 0 0-.487-.35l-2.56-.748a1 1 0 0 1-.654-.665z" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    WhatsApp
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-white/20 bg-white/10 text-white text-[13px] hover:bg-white/15 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10.374 12.426c.155.071.33.087.495.046a.812.812 0 0 0 .415-.274l.266-.35a1.5 1.5 0 0 1 1.2-.598H15a1.5 1.5 0 0 1 1.5 1.5V15A1.5 1.5 0 0 1 15 16.5C11.42 16.5 7.986 15.078 5.454 12.546 2.922 10.014 1.5 6.58 1.5 3A1.5 1.5 0 0 1 3 1.5h2.25a1.5 1.5 0 0 1 1.5 1.5v2.25a1.5 1.5 0 0 1-.848 1.35l-.351.263a.812.812 0 0 0-.274.416.812.812 0 0 0 .046.495C6.605 9.72 8.291 11.404 10.374 12.426z" stroke="white" strokeWidth="0.67" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Call RM
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0E9F8E] text-white text-[13px] font-semibold hover:bg-[#0a8577] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 1.5v3M12 1.5v3M14.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5V15A1.5 1.5 0 0 0 3.75 16.5h10.5A1.5 1.5 0 0 0 15.75 15V4.5A1.5 1.5 0 0 0 14.25 3zM2.25 7.5h13.5" stroke="white" strokeWidth="0.71" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Schedule a Call
                  </button>
                </div>
              </div>

              {/* ── Disclaimer ────────────────────────────────────────────── */}
              <div className="flex items-start gap-3 p-4 bg-[#F8FAFB] rounded-[10px] border border-[#E2E8EE]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                  <path d="M14.487 12L9.153 2.667a1.5 1.5 0 0 0-2.64 0L1.5 12a1.5 1.5 0 0 0 1.333 2.333h10.667A1.5 1.5 0 0 0 14.487 12z" stroke="#C07B1A" strokeWidth="1.33" />
                  <path d="M8 6v2.667M8 11.333H8.007" stroke="#C07B1A" strokeWidth="1.33" />
                </svg>
                <p className="text-[11.5px] text-[#6B8299] leading-[1.6]">
                  SIFcase is a research and comparison platform. Information shown is for educational purposes only and should not be considered
                  investment advice. Investments in securities markets are subject to market risks. Please read all official scheme documents carefully
                  before investing. Past performance is not indicative of future results. SIFs require a minimum investment of ₹10 lakh.
                </p>
              </div>

              {/* ── Strategy Explainer ────────────────────────────────────── */}
              {explainer && (
                <section>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Strategy</div>
                  <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">What this strategy is trying to do</h2>
                  <div className="grid md:grid-cols-2 gap-px bg-[#E2E8EE] border border-[#E2E8EE] rounded-[18px] overflow-hidden">
                    {[
                      { label: "What it is", text: explainer.what },
                      { label: "How it works", text: explainer.how },
                      { label: "When it performs best", text: explainer.when },
                      { label: "Key risks to understand", text: explainer.risk },
                    ].map(({ label, text }) => (
                      <div key={label} className="bg-white p-5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-2">{label}</div>
                        <p className="text-[13.5px] text-[#334155] leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Suitability ───────────────────────────────────────────── */}
              {fundDetails && (fundDetails.suitableFor || fundDetails.notSuitableFor) && (
                <section>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Investor Suitability</div>
                  <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Is this fund right for you?</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {fundDetails.suitableFor && (
                      <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="size-4 text-[#1A9E5F]" strokeWidth={2} />
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">Suitable for</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.suitableFor}</p>
                      </div>
                    )}
                    {fundDetails.notSuitableFor && (
                      <div className="rounded-[16px] border border-red-200 bg-red-50 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="size-4 text-[#F87171]" strokeWidth={2} />
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">Not suitable for</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.notSuitableFor}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Market Scenario ───────────────────────────────────────── */}
              {fundDetails && (fundDetails.bullMarket || fundDetails.bearMarket || fundDetails.sidewaysMarket) && (
                <section>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Market Scenario Performance</div>
                  <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">How this fund may behave across cycles</h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {fundDetails.bullMarket && (
                      <div className="rounded-[16px] border border-[#E2E8EE] bg-white p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="size-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <TrendingUp className="size-4 text-[#1A9E5F]" strokeWidth={2} />
                          </span>
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">In Bull Markets</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.bullMarket}</p>
                      </div>
                    )}
                    {fundDetails.bearMarket && (
                      <div className="rounded-[16px] border border-[#E2E8EE] bg-white p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="size-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                            <TrendingDown className="size-4 text-[#F87171]" strokeWidth={2} />
                          </span>
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">In Bear Markets</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.bearMarket}</p>
                      </div>
                    )}
                    {fundDetails.sidewaysMarket && (
                      <div className="rounded-[16px] border border-[#E2E8EE] bg-white p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="size-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <ArrowLeftRight className="size-4 text-[#0E9F8E]" strokeWidth={2} />
                          </span>
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">In Sideways Markets</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.sidewaysMarket}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Portfolio fit ─────────────────────────────────────────── */}
              {fundDetails && (fundDetails.howItWorks || fundDetails.mfEquivalent || fundDetails.portfolioFit) && (
                <section>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Where Does This Fund Fit?</div>
                  <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Understanding the fund&apos;s role in your portfolio</h2>
                  <div className="space-y-3">
                    {fundDetails.howItWorks && (
                      <div className="rounded-[16px] border border-[#E2E8EE] bg-white p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Compass className="size-4 text-[#0E9F8E]" strokeWidth={2} />
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">How this fund works</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.howItWorks}</p>
                      </div>
                    )}
                    {fundDetails.mfEquivalent && (
                      <div className="rounded-[16px] border border-[#E2E8EE] bg-white p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart2 className="size-4 text-[#0E9F8E]" strokeWidth={2} />
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">Closest mutual fund equivalent</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.mfEquivalent}</p>
                      </div>
                    )}
                    {fundDetails.portfolioFit && (
                      <div className="rounded-[16px] border border-[#E2E8EE] bg-white p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="size-4 text-[#0E9F8E]" strokeWidth={2} />
                          <h3 className="text-[14px] font-bold text-[#0F1C28]">Where it fits in your portfolio</h3>
                        </div>
                        <p className="text-[13px] text-[#334155] leading-relaxed">{fundDetails.portfolioFit}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Taxation ──────────────────────────────────────────────── */}
              <section>
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Taxation</div>
                <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">How returns from this fund are taxed</h2>
                <div className="grid md:grid-cols-3 gap-px bg-[#E2E8EE] border border-[#E2E8EE] rounded-[18px] overflow-hidden">
                  {TAXATION.map(({ type, rule }) => (
                    <div key={type} className="bg-white p-5">
                      <div className="text-[13px] font-semibold text-[#0F1C28] mb-2">{type}</div>
                      <p className="text-[13px] text-[#334155] leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-[#6B8299]">
                  Based on fund category ({fund.category}). Consult a tax advisor for your specific situation.
                </p>
              </section>

              {/* ── Source trust strip ────────────────────────────────────── */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#6B8299] pb-4">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#1A9E5F]" />
                  NAV from AMFI
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-[#0E9F8E]" />
                  Returns calculated from NAV history
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MinusCircle className="size-3.5 text-[#6B8299]" />
                  Scheme details pending ISID/AMC verification
                </span>
              </div>
            </div>

            {/* ── RIGHT: Sidebar ────────────────────────────────────── */}
            <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start lg:ml-auto">

              {/* NAV Action Card */}
              <NavActionCard
                fund={fund}
                navChange={navChange}
                navChangePositive={navChangePositive}
                navChangePct={navChangePct}
                fundDetails={fundDetails}
                className="hidden lg:block"
              />

              {/* Scheme Information */}
              <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E2E8EE]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#0E9F8E" strokeWidth="1.17" />
                    <path d="M7 9.33V7M7 4.67H7.006" stroke="#0E9F8E" strokeWidth="1.17" strokeLinecap="round" />
                  </svg>
                  <span className="text-[13px] font-semibold text-[#0E2A47]">Scheme information</span>
                </div>
                <div className="px-4">
                  <InfoRow label="Scheme code" value={fund.schemeCode} />
                  <InfoRow label="Category" value={fund.category} />
                  <InfoRow label="Strategy" value={fund.strategy} />
                  <InfoRow label="Plan" value={fund.plan} />
                  <InfoRow label="Option" value={fund.option} />
                  <InfoRow label="Launch date" value={formatLaunchMonth(fund.launchDate)} />
                  <InfoRow label="Benchmark" value={fund.benchmark ?? fundDetails?.benchmarkName ?? "—"} />
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E2E8EE]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M8.167 7.583a3.5 3.5 0 0 1-4.667.292M5.833 6.417a3.5 3.5 0 0 1 4.667-.292M8.167 13.75a5.833 5.833 0 1 0 0-11.667 5.833 5.833 0 0 0 0 11.667z" stroke="#0E9F8E" strokeWidth="1.17" />
                  </svg>
                  <span className="text-[13px] font-semibold text-[#0E2A47]">Quick links</span>
                </div>
                <div>
                  {[
                    { label: "Compare with other funds →", href: `/compare?funds=${encodeURIComponent(fund.schemeCode)}` },
                    { label: "Learn how SIFs work →", href: "/sif-101" },
                    { label: "View open NFOs →", href: "/sifs?filter=nfo" },
                    { label: "Speak to a specialist →", href: "#" },
                  ].map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="block px-4 py-[9px] border-b border-[#E2E8EE] last:border-0 text-[13px] font-medium text-[#0E9F8E] hover:bg-[#F4F6F8] transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
