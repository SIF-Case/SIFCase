import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { extractSchemeCode, fundSlug, fundHref } from "@/lib/slugify";
import {
  ShieldCheck, TrendingUp, MinusCircle, ExternalLink,
  CheckCircle2, XCircle, BarChart2,
  Building2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/app/providers";
import { FundDetailPanel } from "@/components/sections/FundDetailPanel";
import { NavActionCard } from "@/components/sections/NavActionCard";
import { ScenarioTabs } from "@/components/sections/ScenarioTabs";
import { getFundDetail, getFundDetailsForName, getTopFunds, type PeriodKey } from "@/lib/sifData";
import { getCategoryAverageSeries } from "@/lib/categoryAverages";
import { FundDetailsSection } from "@/components/sections/FundDetailsSection";
import { SEBIRiskometer, RISK_LABELS } from "@/components/ui/RiskMeter";
import { FundSectionNav } from "@/components/sections/FundSectionNav";
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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// inceptionDate is free text from KIM/ISID entry, so normalise the common shapes
// to "15 Mar 2025". Anything unparseable is passed through untouched.
function formatInceptionDate(raw: string): string {
  const s = raw.trim();
  if (!s) return s;

  const monthIndex = (name: string) =>
    MONTH_NAMES.findIndex((m) => name.toLowerCase().startsWith(m.toLowerCase()));

  const build = (day: number, month: number, year: number) => {
    if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900) return null;
    return `${day} ${MONTH_NAMES[month]} ${year}`;
  };

  // 2025-03-15 / 2025/03/15
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return build(+m[3], +m[2] - 1, +m[1]) ?? s;

  // 15-03-2025 / 15/03/2025 / 15.03.2025  (day first — Indian convention)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return build(+m[1], +m[2] - 1, +m[3]) ?? s;

  // 15 Mar 2025 / 15-Mar-2025 / 15 March, 2025
  m = s.match(/^(\d{1,2})[-\s]+([A-Za-z]+),?[-\s]+(\d{4})$/);
  if (m) return build(+m[1], monthIndex(m[2]), +m[3]) ?? s;

  // Mar 15, 2025 / March 15 2025
  m = s.match(/^([A-Za-z]+)[-\s]+(\d{1,2}),?[-\s]+(\d{4})$/);
  if (m) return build(+m[2], monthIndex(m[1]), +m[3]) ?? s;

  return s;
}

function formatLaunchDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
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
    <div className="flex items-center gap-3 py-[7px] border-b border-[#E2E8EE] last:border-0">
      <div className="w-[100px] sm:w-[170px] shrink-0">
        <span className={`text-[13px] truncate block ${isThisFund ? "font-semibold text-[#0F1C28]" : "font-medium text-[#3D5166]"}`}>
          {label}
        </span>
      </div>
      {value !== null ? (
        <>
          <div className="flex-1 h-[20px] bg-[#EEF2F8] rounded-[6px] overflow-hidden">
            <div
              className="h-full rounded-[6px] transition-all"
              style={{
                width: `${Math.max(pct, 2)}%`,
                background: !positive
                  ? "#F87171"
                  : isThisFund
                    ? "linear-gradient(90deg,#0E9F8E,#0B7F73)"
                    : "#8CA0BE",
              }}
            />
          </div>
          <div className="w-[56px] shrink-0 text-right">
            <span className={`text-[13px] font-bold tabular-nums ${positive ? "text-[#1A9E5F]" : "text-[#F87171]"}`}>
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

// ── Empty state (for sections with no data yet) ───────────────────────────────

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-[14px] border border-dashed border-[#CCD5DD] p-8 text-center">
      <h3 className="text-[15px] font-bold text-[#0F1C28] mb-1.5">{title}</h3>
      <p className="text-[13px] text-[#6B8299] leading-relaxed max-w-[440px] mx-auto">{body}</p>
    </div>
  );
}

// ── Hero: 5-segment risk gauge with pointer ───────────────────────────────────

const GAUGE_SEGMENTS = ["#3FCB6F", "#B7D84A", "#F2C23C", "#F0873F", "#E5484D"];

function HeroGauge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const idx = Math.max(1, Math.min(5, Math.round(level)));
  return (
    <div className="flex h-[6px] rounded-[4px] overflow-hidden">
      {GAUGE_SEGMENTS.map((c, i) => (
        <span key={i} className="flex-1 relative" style={{ background: c }}>
          {i + 1 === idx && (
            <span className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-[2px] h-[12px] bg-white rounded-[2px] shadow-[0_0_0_2px_rgba(255,255,255,0.28)]" />
          )}
        </span>
      ))}
    </div>
  );
}

// ── Hero: compact risk-band widget item ───────────────────────────────────────

function HeroRiskItem({
  label,
  level,
  secondary,
  sub,
}: {
  label: string;
  level: 1 | 2 | 3 | 4 | 5;
  secondary?: boolean;
  sub?: string;
}) {
  return (
    <div className={`py-[5px] ${secondary ? "opacity-80 border-t border-white/[0.14] mt-1.5 pt-2.5" : ""}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="text-[11px] font-semibold text-white/70">{label}</span>
        <span className="text-[12px] font-extrabold text-white whitespace-nowrap">{RISK_LABELS[level - 1]}</span>
      </div>
      <HeroGauge level={level} />
      {sub && <div className="text-[9.5px] text-white/45 mt-[5px] leading-[1.4]">{sub}</div>}
    </div>
  );
}

// ── Hero: live stat cell ──────────────────────────────────────────────────────

function HeroStat({
  label,
  value,
  valueClass,
  sub,
  last,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div className={`flex-1 min-w-[130px] px-4 py-3 ${last ? "" : "sm:border-r border-white/[0.13]"}`}>
      <div className="text-[11px] font-semibold text-white/45 mb-1.5">{label}</div>
      <div className={`text-[18px] font-bold tabular-nums ${valueClass ?? "text-white"}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-white/40 mt-0.5">{sub}</div>}
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

  // Expense ratio (TER) — always rendered with a trailing "%"; the terMax fallback
  // is stored without one.
  const rawTer = fund.expenseRatio ?? fundDetails?.terMax ?? null;
  const expenseRatioDisplay =
    rawTer != null && String(rawTer).trim() !== "" ? `${String(rawTer).replace(/%\s*$/, "")}%` : "—";

  const reinvestVariant = fund.variants.find(
    (v) => v.option === "IDCW Reinvestment" && v.schemeCode === fund.schemeCode
  );
  const displayIsin = isReinvest && reinvestVariant?.isin ? reinvestVariant.isin : fund.isin;

  // ── Category metrics ────────────────────────────────────────────────────────
  const catFunds = allFunds.filter((f) => f.strategy === fund.strategy);
  const catCount = catFunds.length;

  const cat1MAvg = safeAvg(catFunds.map((f) => f.returns["1M"]));

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
    <Providers funds={allFunds}>
      <Navbar />

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="bg-[#F4F6F8]">
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

      {/* ── Hero Banner (floating gradient card) ────────────────────────────── */}
      <div className="bg-[#F4F6F8]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 pt-4 pb-2">
          <section
            className="relative overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(11,37,69,0.12)]"
            style={{ background: "linear-gradient(155deg,#0B2545 0%,#12335C 60%,#1B4E82 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(520px 340px at 8% -15%, rgba(14,159,142,0.28), transparent 62%)" }}
            />
            <div className="relative px-5 sm:px-8 pt-7 pb-6">

          <div className="flex flex-col lg:flex-row lg:justify-between gap-6 lg:gap-8">
          {/* LEFT: identity */}
          <div className="min-w-0">
          <div className="flex gap-4">
            {/* Fund house logo */}
            <div className="w-11 h-11 rounded-[10px] bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
              {fund.logoUrl ? (
                <Image
                  src={fund.logoUrl}
                  alt={fund.amc}
                  width={36}
                  height={36}
                  className="object-contain max-w-full max-h-full"
                  style={{ width: "auto", height: "auto" }}
                />
              ) : (
                <span className="text-[#0E9F8E] text-[15px] font-extrabold leading-none">{amcInitial}</span>
              )}
            </div>

            <div className="min-w-0">
              {/* Brand row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2">
                <span className="text-[15px] font-semibold text-[#DCE7F8]">{fund.amc}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full bg-[rgba(22,163,74,0.2)] border border-[rgba(140,235,174,0.4)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8CEBAE]" />
                  <span className="text-[11px] font-bold text-[#8CEBAE]">Active</span>
                </span>
                <Link
                  href="/sifs"
                  className="text-[12px] font-semibold text-[#8FE0D2] border-b border-[#8FE0D2]/45 hover:text-white hover:border-white transition-colors"
                >
                  View all {fund.amc} schemes →
                </Link>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[11px] px-2.5 py-[3px] rounded-full bg-white/10 border border-white/[0.18] text-[#DCE7F8]">{fund.category}</span>
                <span className="text-[11px] px-2.5 py-[3px] rounded-full bg-white/10 border border-white/[0.18] text-[#DCE7F8]">{fund.strategy}</span>
              </div>

              {/* Title */}
              <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white leading-[1.15] tracking-[-0.5px] mb-2">
                {fund.fundName}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#B9CCEA]">
                {displayIsin && (
                  <>
                    <span>ISIN {displayIsin}</span>
                    <span className="text-white/25">·</span>
                  </>
                )}
                <span>Launched {formatLaunchDate(fund.launchDate)}</span>
                {(fund.benchmark ?? fundDetails?.benchmarkName) && (
                  <>
                    <span className="text-white/25">·</span>
                    <span>Benchmark <span className="text-white/85 font-medium">{fund.benchmark ?? fundDetails?.benchmarkName}</span></span>
                  </>
                )}
              </div>

              {/* Plan & Option switcher */}
              {hasVariants && (
                <div className="mt-4">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.9px] text-white/40 mb-2">Plan &amp; Option</div>
                  <div className="flex flex-wrap gap-2">
                    {fund.variants.map((v) => {
                      const isVirtualReinvest = v.option === "IDCW Reinvestment";
                      const isCurrent = isVirtualReinvest
                        ? isReinvest && v.schemeCode === fund.schemeCode
                        : !isReinvest && v.schemeCode === fund.schemeCode && v.option === fund.option;
                      const href = isVirtualReinvest
                        ? `${fundHref(fund.fundName, v.schemeCode)}?variant=reinvest`
                        : fundHref(fund.fundName, v.schemeCode);
                      return isCurrent ? (
                        <span key={`${v.schemeCode}-${v.option}`} className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#0E9F8E] text-white border border-[#0E9F8E]">
                          {v.option}
                        </span>
                      ) : (
                        <Link
                          key={`${v.schemeCode}-${v.option}`}
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
            </div>
          </div>

          </div>{/* end LEFT identity column */}

          {/* RIGHT: actions + compact risk-band widget */}
          <div className="flex flex-col items-stretch lg:items-end gap-3 shrink-0">
            <div className="flex gap-2 w-full lg:justify-end">
              <Link
                href={`/compare?funds=${encodeURIComponent(fund.schemeCode)}`}
                className="flex-1 lg:flex-none text-center text-[13px] font-semibold px-4 py-2.5 rounded-[10px] bg-white/[0.08] border border-white/[0.22] text-white hover:bg-white/[0.16] transition-colors"
              >
                + Add to Compare
              </Link>
              <a
                href="mailto:support@sifcase.com"
                className="flex-1 lg:flex-none text-center text-[13px] font-bold px-4 py-2.5 rounded-[10px] bg-[#0E9F8E] text-white hover:bg-[#12b3a3] transition-colors shadow-[0_6px_16px_rgba(14,159,142,0.35)]"
              >
                Request Callback
              </a>
            </div>
            {fundDetails?.riskBand != null && (
              <div className="w-full lg:w-[248px] rounded-[12px] border border-white/[0.22] bg-white/[0.09] px-3.5 py-3">
                <HeroRiskItem label="Fund Risk Band" level={fundDetails.riskBand} />
                {fundDetails.benchmarkRiskBand != null && (
                  <HeroRiskItem
                    label="Benchmark Risk Band"
                    level={fundDetails.benchmarkRiskBand}
                    secondary
                    sub="For reference only — not a SEBI-mandated fund disclosure."
                  />
                )}
                <div className="text-right mt-2.5 pt-2.5 border-t border-white/[0.14]">
                  <a href="#risk-analytics" className="text-[10.5px] font-medium text-[#8FE0D2] underline hover:text-white transition-colors">Full risk analytics →</a>
                </div>
              </div>
            )}
          </div>
          </div>{/* end hero-top */}

          {/* Live stats strip */}
          <div className="flex flex-wrap mt-6 rounded-[12px] border border-white/[0.18] bg-white/[0.06] overflow-hidden">
            <HeroStat
              label="Latest NAV"
              value={`₹${fund.nav.toFixed(4)}`}
              valueClass={navChangePositive ? "text-[#4ADE80]" : "text-[#F87171]"}
              sub={
                navChange !== null
                  ? `${navChangePositive ? "+" : ""}₹${navChange.toFixed(4)}${navChangePct !== null ? ` (${navChangePositive ? "+" : ""}${navChangePct.toFixed(2)}%)` : ""} · ${fund.navDate}`
                  : fund.navDate
              }
            />
            <HeroStat label="AUM" value={fmtCr(fund.aum ?? fundDetails?.aumCurrent ?? null)} />
            <HeroStat
              label={siLabel}
              value={fmtPct(fund.returns.SI, 1) ?? "—"}
              valueClass={(fund.returns.SI ?? 0) >= 0 ? "text-[#4ADE80]" : "text-[#F87171]"}
              sub={fundAgeYears > 1 ? "Annualised (CAGR)" : "Absolute, not annualised"}
            />
            <HeroStat label="Min. Investment" value={fmtInr(fundDetails?.minInvestment ?? null)} />
            <HeroStat
              label="Expense Ratio"
              value={expenseRatioDisplay}
              last
            />
          </div>
          </div>{/* end hero content */}
          </section>
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────────── */}
      <div className="bg-[#F4F6F8] min-h-screen overflow-x-clip">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-10 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:justify-between">

            {/* ── LEFT: Main content ────────────────────────────────────── */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[calc(100%-364px)] flex flex-col gap-6">

              {/* ── Sticky in-page section nav ────────────────────────────── */}
              <FundSectionNav />

              <div className="block lg:hidden">
                <NavActionCard
                  fund={fund}
                  navChange={navChange}
                  navChangePositive={navChangePositive}
                  navChangePct={navChangePct}
                  fundDetails={fundDetails}
                />
              </div>

              {/* ═══════════ PERFORMANCE ═══════════ */}
              <section id="performance" className="scroll-mt-[140px] flex flex-col gap-6">

              {/* ── Trailing returns ─────────────────────────────────────── */}
              <div className="bg-white rounded-[14px] border border-[#E2E8EE] p-5 sm:p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">
                  Returns · Source: AMFI NAV history
                </div>
                <h2 className="text-[18px] font-bold text-[#0E2A47] mb-1">Trailing returns</h2>
                <p className="text-[13px] text-[#6B8299] mb-4">Fund return vs. {fund.strategy} category average.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {heroReturns.map((r) => {
                    const positive = r.value !== null ? r.value >= 0 : true;
                    return (
                      <div key={r.label} className="bg-[#F4F6F8] rounded-[11px] px-3.5 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6B8299] mb-1.5">{r.label}</div>
                        {r.value !== null ? (
                          <div className={`text-[21px] font-extrabold tabular-nums leading-none ${positive ? "text-[#1A9E5F]" : "text-[#F87171]"}`}>
                            {positive ? "+" : ""}{r.value.toFixed(1)}%
                          </div>
                        ) : (
                          <div className="text-[21px] font-bold text-[#AAB4C4] leading-none">—</div>
                        )}
                        <div className="text-[10.5px] text-[#6B8299] mt-1.5">
                          {r.note ? r.note : r.catAvg !== null ? `Cat avg ${r.catAvg >= 0 ? "+" : ""}${r.catAvg.toFixed(1)}%` : "Not available"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── NAV chart ─────────────────────────────────────────────── */}
              <div className="bg-white rounded-[14px] border border-[#E2E8EE] p-5">
                <FundDetailPanel
                  fund={fund}
                  categoryAvg={categoryAvg}
                  categoryLabel={fund.strategy}
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
                  <InfoRow label="Expense ratio" value={expenseRatioDisplay} />
                  <InfoRow label="AUM" value={fmtCr(fund.aum ?? fundDetails?.aumCurrent ?? null)} />
                  <InfoRow label="Inception date" value={fundDetails?.inceptionDate ? formatInceptionDate(fundDetails.inceptionDate) : formatLaunchDate(fund.launchDate)} />
                  <InfoRow label="Benchmark" value={fund.benchmark ?? fundDetails?.benchmarkName ?? "—"} />
                </div>
                {/* Exit load — highlighted cost card */}
                <div className="mx-4 mb-4 mt-1 rounded-[12px] border border-[#CFEFDA] bg-[#EAF9EF] p-4">
                  <div className="flex items-start justify-between gap-4 py-[6px] border-b border-dashed border-[#CFEFDA]">
                    <span className="text-[12.5px] font-semibold text-[#1B5E3A]">Exit load</span>
                    <span className="text-[12.5px] font-bold text-[#0F3D24] text-right max-w-[58%]">{fundDetails?.exitLoad || "Nil"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-[6px]">
                    <span className="text-[12.5px] font-semibold text-[#1B5E3A]">Maximum TER</span>
                    <span className="text-[12.5px] font-bold text-[#0F3D24]">{expenseRatioDisplay}</span>
                  </div>
                </div>
              </div>

              {/* ── Speak to RM ───────────────────────────────────────────── */}


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
                  <ScenarioTabs
                    bull={fundDetails.bullMarket}
                    bear={fundDetails.bearMarket}
                    sideways={fundDetails.sidewaysMarket}
                  />
                </section>
              )}

              {/* ── Portfolio fit ─────────────────────────────────────────── */}
              {fundDetails && (fundDetails.mfEquivalent || fundDetails.portfolioFit) && (
                <section>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Where Does This Fund Fit?</div>
                  <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Understanding the fund&apos;s role in your portfolio</h2>
                  <div className="space-y-3">
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

              </section>{/* ═══════════ end PERFORMANCE ═══════════ */}

              {/* ═══════════ RISK ANALYTICS ═══════════ */}
              <section id="risk-analytics" className="scroll-mt-[140px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Risk Analytics</div>
                <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Risk-adjusted metrics</h2>
                <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden divide-y divide-[#E2E8EE]">
                  {[
                    { label: "Sharpe Ratio (SI)", value: fund.sharpes["SI"] !== null ? fund.sharpes["SI"]!.toFixed(2) : null, note: "Risk-adjusted return per unit of volatility." },
                    { label: "Volatility (SI)", value: fund.volatilities["SI"] !== null ? `${fund.volatilities["SI"]!.toFixed(2)}%` : null, note: "Annualised standard deviation of daily returns." },
                    { label: "Max Drawdown (SI)", value: fund.drawdowns["SI"] !== null ? `${fund.drawdowns["SI"]!.toFixed(2)}%` : null, note: "Peak-to-trough decline in NAV since inception." },
                    { label: "Max Drawdown (3M)", value: fund.drawdowns["3M"] !== null ? `${fund.drawdowns["3M"]!.toFixed(2)}%` : null, note: "Peak-to-trough in last 3 months." },
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
                  {fundDetails?.riskBand != null && (
                    <div className="p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#6B8299] mb-4">SEBI Riskometer</div>
                      <div className={`grid gap-6 ${fundDetails.benchmarkRiskBand != null ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
                        <SEBIRiskometer level={fundDetails.riskBand} title={fund.fundName} />
                        {fundDetails.benchmarkRiskBand != null && (
                          <SEBIRiskometer level={fundDetails.benchmarkRiskBand} title={fundDetails.benchmarkName || "Benchmark"} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ═══════════ PORTFOLIO ═══════════ */}
              <section id="portfolio" className="scroll-mt-[140px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Portfolio</div>
                <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Portfolio holdings</h2>
                {fundDetails && (fundDetails.assetAllocation?.length > 0 || fundDetails.topHoldings?.length > 0) ? (
                  <FundDetailsSection details={fundDetails} />
                ) : (
                  <EmptyState
                    title="Holdings disclosure pending"
                    body="Per SEBI's SIF framework, portfolio disclosures are made every alternate month. Sector allocation, top holdings and net long/short exposure will populate here once the AMC's next disclosure is verified against ISID."
                  />
                )}
              </section>

              {/* ═══════════ FUND MANAGER ═══════════ */}
              <section id="fund-manager" className="scroll-mt-[140px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Fund Manager</div>
                <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Who manages this fund</h2>
                {fundDetails?.fundManagers?.length ? (
                  <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden divide-y divide-[#E2E8EE]">
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
                ) : (
                  <EmptyState
                    title="Fund manager details pending verification"
                    body="Name, tenure, qualifications and other schemes managed will appear here once confirmed against the ISID / SID."
                  />
                )}
              </section>

              {/* ═══════════ DOCUMENTS ═══════════ */}
              <section id="documents" className="scroll-mt-[140px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#0E9F8E] mb-1">Documents</div>
                <h2 className="text-[20px] font-bold text-[#0E2A47] mb-4">Scheme documents</h2>
                {fundDetails?.factsheets?.length ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {fundDetails.factsheets.map((f, i) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-white border border-[#E2E8EE] rounded-[12px] hover:border-[#0E9F8E] transition-colors group"
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
                ) : (
                  <EmptyState
                    title="No documents published yet"
                    body="Official filings — Scheme Information Document, Investment Strategy Information Document and portfolio disclosures — will appear here once uploaded and verified."
                  />
                )}
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
            <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start lg:ml-auto">

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
                  <InfoRow label="Category" value={fund.category} />
                  <InfoRow label="Strategy" value={fund.strategy} />
                  <InfoRow label="Option" value={fund.option} />
                  <InfoRow label="Launch date" value={formatLaunchDate(fund.launchDate)} />
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
                    { label: "View open NFOs →", href: "/nfos" },
                    { label: "Speak to a specialist →", href: "mailto:support@sifcase.com" },
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
    </Providers>
  );
}
