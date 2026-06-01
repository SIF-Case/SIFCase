import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, ShieldCheck, TrendingUp, MinusCircle, ExternalLink, CalendarDays, Info } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FundDetailPanel } from "@/components/sections/FundDetailPanel";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { getFundDetail } from "@/lib/sifData";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ variant?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const fund = await getFundDetail(code);
  if (!fund) return { title: "Fund not found — SIFcase" };
  return {
    title: `${fund.fundName} — SIFcase`,
    description: `${fund.strategy} SIF by ${fund.amc}. Latest NAV ₹${fund.nav.toFixed(4)} as of ${fund.navDate}. Source-verified returns and risk metrics.`,
  };
}

export default async function FundDetailPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { variant } = await searchParams;
  const isReinvest = variant === "reinvest";
  const fund = await getFundDetail(code);

  if (!fund) notFound();

  const siReturn = fund.returns.SI;
  const positive = siReturn !== null ? siReturn >= 0 : true;

  // When ?variant=reinvest, show the reinvestment ISIN instead
  const reinvestVariant = fund.variants.find((v) => v.option === "IDCW Reinvestment" && v.schemeCode === fund.schemeCode);
  const displayIsin = isReinvest && reinvestVariant?.isin ? reinvestVariant.isin : fund.isin;

  function fmtReturn(v: number | null) {
    if (v === null) return null;
    return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  }

  const RETURN_ROWS = [
    { label: "YTD", value: fmtReturn(fund.returns.YTD) },
    { label: "1M", value: fmtReturn(fund.returns["1M"]) },
    { label: "3M", value: fmtReturn(fund.returns["3M"]) },
    { label: "6M", value: fmtReturn(fund.returns["6M"]) },
    { label: "1Y", value: fmtReturn(fund.returns["1Y"]) },
    { label: "Since Inception", value: fmtReturn(fund.returns.SI) },
  ];

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
    "Quant": {
      what: "Uses systematic, model-driven signals to construct the portfolio. Factor exposures — momentum, value, quality, low-volatility — are combined mathematically rather than through qualitative judgement.",
      how: "Algorithms screen the investable universe daily, rank securities by factor scores, and rebalance to maintain target exposures. Some strategies also use machine learning signals.",
      when: "Factor strategies work well in trending markets where momentum, value, or quality themes are rewarded consistently over time.",
      risk: "Factor drawdowns can persist for extended periods. Crowding in popular factors can cause simultaneous losses when investors de-risk. Model risk if market dynamics change.",
    },
    "Arbitrage": {
      what: "Captures the spread between cash prices and futures prices of the same stock or index. Returns are similar to short-term debt instruments but taxed as equity.",
      how: "The fund simultaneously buys stock in the cash market and sells an equivalent futures contract at a higher price. The difference is locked in as return at expiry.",
      when: "Most effective when futures roll yields are elevated — typically in volatile or bullish markets where futures trade at a significant premium to spot.",
      risk: "Returns compress when futures premiums shrink. Liquidity risk in individual stock futures. Rollover costs can eat into returns in low-premium environments.",
    },
  };

  const explainer = STRATEGY_EXPLAINERS[fund.strategy] ?? null;

  const TAXATION: { type: string; rule: string }[] = fund.category === "Equity"
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

  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO HEADER ────────────────────────────────────────────────── */}
        <div className="bg-brand-navy text-white">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-white/50 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/sifs" className="hover:text-white transition-colors">All SIFs</Link>
              <span>/</span>
              <span className="text-white/80">{displayIsin || fund.schemeCode}</span>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
              {/* Left: Identity */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[11px] font-mono uppercase tracking-widest bg-primary/20 text-primary-tint px-3 py-1 rounded-full border border-primary/30">
                    {fund.strategy}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-widest bg-verified/20 text-[#6EF0B6] px-3 py-1 rounded-full border border-verified/30">
                    Active
                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight mb-3">
                  {fund.fundName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-[13px] text-white/60">
                  <span className="text-white/80 font-medium">{fund.amc}</span>
                  <span className="text-white/30">·</span>
                  <span>{fund.category}</span>
                  <span className="text-white/30">·</span>
                  <span>Launched {fund.launchDate}</span>
                  {displayIsin && (
                    <>
                      <span className="text-white/30">·</span>
                      <span className="font-mono">{displayIsin}</span>
                    </>
                  )}
                </div>

                {/* Variant switcher */}
                {fund.variants.length > 1 && (
                  <div className="mt-5">
                    <div className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-white/40 mb-2">
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
                          ? `/sifs/${v.schemeCode.toLowerCase()}?variant=reinvest`
                          : `/sifs/${v.schemeCode.toLowerCase()}`;
                        return isCurrent ? (
                          <span
                            key={key}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-primary text-white border border-primary/60"
                          >
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

                {/* Trust strip */}
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-white/50">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-verified" />
                    NAV from AMFI
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-primary-tint" />
                    Returns calculated from NAV history
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MinusCircle className="size-3.5 text-white/30" />
                    Scheme details pending ISID/AMC verification
                  </span>
                </div>
              </div>

              {/* Right: NAV card */}
              <div className="bg-white/8 border border-white/12 rounded-2xl p-6 space-y-5">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">Latest NAV</div>
                  <div className="text-[42px] font-bold tracking-tight tabular text-white leading-none">
                    ₹{fund.nav.toFixed(4)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[12px] text-white/50">
                    <CalendarDays className="size-3.5" />
                    <span>As of {fund.navDate}</span>
                    <SourceBadge variant="amfi" className="text-[9.5px]" />
                  </div>
                </div>

                {siReturn !== null && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">Since Inception</div>
                    <div className={`text-[22px] font-bold tabular ${positive ? "text-[#6EF0B6]" : "text-[#FF8080]"}`}>
                      {positive ? "+" : ""}{siReturn.toFixed(2)}%
                    </div>
                    <SourceBadge variant="calculated" className="text-[9.5px] mt-1.5" />
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <Link href="/compare" className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover transition">
                    <Plus className="size-4" /> Add to Compare
                  </Link>
                  <button className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/20 text-white/70 text-[13px] hover:bg-white/8 transition">
                    <ExternalLink className="size-4" /> View Documents
                    <span className="text-[10px] font-mono ml-1 text-white/30">· Coming soon</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-10 space-y-12">

          {/* ── RETURNS GRID ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-rule border border-rule rounded-[18px] overflow-hidden shadow-card">
            {RETURN_ROWS.map(({ label, value }) => {
              const val = value ? parseFloat(value) : null;
              return (
                <div key={label} className="bg-white p-4 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">{label}</div>
                  {value !== null ? (
                    <div className={`text-[16px] font-bold tabular ${val! >= 0 ? "text-gain" : "text-loss"}`}>{value}</div>
                  ) : (
                    <div className="text-[12px] text-muted">Insufficient history</div>
                  )}
                  {value !== null && (
                    <SourceBadge variant="calculated" className="text-[8.5px] mt-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── PERFORMANCE CHART + RISK METRICS ─────────────────────────── */}
          <section>
            <div className="mb-4">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Performance</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">NAV chart & risk-adjusted metrics</h2>
              <p className="mt-1 text-[13px] text-muted">Source: AMFI NAV data. Returns calculated by SIFcase.</p>
            </div>
            <FundDetailPanel fund={fund} />
          </section>

          {/* ── STRATEGY EXPLAINER ───────────────────────────────────────── */}
          <section>
            <div className="mb-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Strategy</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">What this strategy is trying to do</h2>
            </div>

            {explainer ? (
              <div className="grid md:grid-cols-2 gap-px bg-rule border border-rule rounded-[18px] overflow-hidden shadow-card">
                {[
                  { label: "What it is", text: explainer.what },
                  { label: "How it works", text: explainer.how },
                  { label: "When it performs best", text: explainer.when },
                  { label: "Key risks to understand", text: explainer.risk },
                ].map(({ label, text }) => (
                  <div key={label} className="bg-white p-6">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">{label}</div>
                    <p className="text-[14px] text-body leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface border border-rule rounded-[18px] p-8 flex items-center gap-3">
                <MinusCircle className="size-5 text-muted shrink-0" />
                <div>
                  <div className="text-[13px] font-medium text-body">Strategy explainer pending</div>
                  <div className="text-[12px] text-muted mt-0.5">Detailed strategy documentation is being sourced from the AMC and ISID.</div>
                </div>
              </div>
            )}
          </section>

          {/* ── RISK & LIQUIDITY ─────────────────────────────────────────── */}
          <section>
            <div className="mb-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Risk & Liquidity</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">Risk profile and liquidity terms</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Risk metrics */}
              <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-rule bg-surface">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted">Calculated from NAV history</div>
                  <SourceBadge variant="calculated" className="text-[9.5px] mt-1" />
                </div>
                <div className="divide-y divide-rule">
                  {[
                    { label: "Sharpe Ratio (SI)", value: fund.sharpes["SI"] !== null ? fund.sharpes["SI"]!.toFixed(2) : null, note: "Risk-adjusted return per unit of volatility." },
                    { label: "Volatility (SI)", value: fund.volatilities["SI"] !== null ? `${fund.volatilities["SI"]!.toFixed(2)}%` : null, note: "Annualised standard deviation of daily returns." },
                    { label: "Max Drawdown (SI)", value: fund.drawdowns["SI"] !== null ? `${fund.drawdowns["SI"]!.toFixed(2)}%` : null, note: "Peak-to-trough decline in NAV since inception." },
                    { label: "Max Drawdown (3M)", value: fund.drawdowns["3M"] !== null ? `${fund.drawdowns["3M"]!.toFixed(2)}%` : null, note: "Peak-to-trough in last 3 months." },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[13px] font-medium text-body">{label}</div>
                        <div className="text-[11px] text-muted mt-0.5">{note}</div>
                      </div>
                      {value !== null ? (
                        <span className="text-[16px] font-bold tabular text-heading shrink-0">{value}</span>
                      ) : (
                        <span className="text-[12px] text-muted shrink-0">Insufficient history</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Liquidity / scheme info */}
              <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-rule bg-surface">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-muted">Scheme Information</div>
                  <SourceBadge variant="amfi" className="text-[9.5px] mt-1" />
                </div>
                <div className="divide-y divide-rule">
                  {[
                    { label: "Scheme Code", value: fund.schemeCode },
                    { label: "Category", value: fund.category },
                    { label: "Strategy", value: fund.strategy },
                    { label: "Plan", value: fund.plan },
                    { label: "Option", value: fund.option },
                    { label: "Launch Date", value: fund.launchDate },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <span className="text-[13px] text-muted">{label}</span>
                      <span className="text-[13px] font-medium text-body tabular">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── COSTS ─────────────────────────────────────────────────────── */}
          <section>
            <div className="mb-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Costs</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">Expense ratio and charges</h2>
            </div>
            <div className="bg-surface border border-rule rounded-[18px] p-8 flex items-start gap-4">
              <Info className="size-5 text-muted shrink-0 mt-0.5" />
              <div>
                <div className="text-[14px] font-medium text-body mb-1">TER and expense data pending AMC verification</div>
                <div className="text-[13px] text-muted leading-relaxed">
                  Expense ratio, exit load, and other charges are sourced from the AMC's official disclosures and the ISID document.
                  This data will be available once verified.
                </div>
                <SourceBadge variant="review" className="text-[9.5px] mt-3" />
              </div>
            </div>
          </section>

          {/* ── TAXATION ─────────────────────────────────────────────────── */}
          <section>
            <div className="mb-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Taxation</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">How returns from this fund are taxed</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-px bg-rule border border-rule rounded-[18px] overflow-hidden shadow-card">
              {TAXATION.map(({ type, rule }) => (
                <div key={type} className="bg-white p-6">
                  <div className="text-[13px] font-semibold text-heading mb-2">{type}</div>
                  <p className="text-[13px] text-body leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted">Based on fund category ({fund.category}). Consult a tax advisor for your specific situation.</p>
          </section>

          {/* ── DATA CONFIDENCE ──────────────────────────────────────────── */}
          <section>
            <div className="mb-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Data Confidence</div>
              <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">Where each data point comes from</h2>
            </div>
            <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-mist border-b border-rule">
                    <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Field</th>
                    <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Value</th>
                    <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {[
                    { field: "Latest NAV", value: `₹${fund.nav.toFixed(4)}`, badge: "amfi" as const },
                    { field: "NAV Date", value: fund.navDate, badge: "amfi" as const },
                    { field: "SIF / Scheme Code", value: fund.schemeCode, badge: "amfi" as const },
                    { field: "Since Inception Return", value: fund.returns.SI !== null ? `${fund.returns.SI >= 0 ? "+" : ""}${fund.returns.SI.toFixed(2)}%` : "Insufficient history", badge: "calculated" as const },
                    { field: "Sharpe Ratio", value: fund.sharpes["SI"] !== null ? fund.sharpes["SI"]!.toFixed(2) : "Insufficient history", badge: "calculated" as const },
                    { field: "Volatility", value: fund.volatilities["SI"] !== null ? `${fund.volatilities["SI"]!.toFixed(2)}%` : "Insufficient history", badge: "calculated" as const },
                    { field: "Expense Ratio / TER", value: "Pending", badge: "review" as const },
                    { field: "Benchmark", value: "Pending", badge: "review" as const },
                    { field: "Exit Load", value: "Pending", badge: "review" as const },
                    { field: "Fund Manager", value: "Pending", badge: "review" as const },
                  ].map(({ field, value, badge }) => (
                    <tr key={field} className="hover:bg-surface transition-colors">
                      <td className="px-5 py-3.5 font-medium text-body">{field}</td>
                      <td className="px-5 py-3.5 tabular text-muted">{value}</td>
                      <td className="px-5 py-3.5"><SourceBadge variant={badge} className="text-[9.5px]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── LEGAL ────────────────────────────────────────────────────── */}
          <div className="border border-rule rounded-[18px] p-6 bg-surface text-[12px] text-muted leading-relaxed">
            <strong className="text-body">Disclaimer:</strong> SIFcase is a research and comparison platform. Information shown is for educational purposes
            only and should not be considered investment advice. Investments in securities markets are subject to market risks.
            Please read all official scheme documents carefully before investing. Past performance is not indicative of future results.
            SIFs are higher-ticket investment products and may not be suitable for every investor.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
