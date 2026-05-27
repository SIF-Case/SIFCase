"use client";

import { useState } from "react";
import { ChevronDown, ArrowRight, ArrowDown } from "lucide-react";

// ── Static fund data ──────────────────────────────────────────────────────────
const FUNDS = [
  {
    name: "qsif Ex Top 100 Long-Short",
    amc: "Quant Mutual Fund",
    nav: 10.84,
    aum: "₹211.68 Cr",
    returns1y: 5.36,
    sharpe: 1.82,
    drawdown: -3.24,
    risk: "HIGH RISK",
    riskLevel: 0.78,
    category: "Equity",
    sparkline: [10.0, 9.6, 10.1, 9.9, 10.4, 10.2, 10.7, 10.5, 11.1, 10.8, 11.3, 10.84],
  },
  {
    name: "Altiva Hybrid Long-Short",
    amc: "Altiva Asset Management",
    nav: 11.48,
    aum: "₹482.10 Cr",
    returns1y: 8.42,
    sharpe: 2.04,
    drawdown: -2.18,
    risk: "MOD-HIGH RISK",
    riskLevel: 0.63,
    category: "Hybrid",
    sparkline: [10.0, 10.3, 10.1, 10.6, 10.5, 10.9, 10.8, 11.1, 11.0, 11.3, 11.2, 11.48],
  },
  {
    name: "Nuvama Market Neutral",
    amc: "Nuvama Asset Management",
    nav: 10.14,
    aum: "₹168.30 Cr",
    returns1y: 1.84,
    sharpe: 2.41,
    drawdown: -1.02,
    risk: "MODERATE RISK",
    riskLevel: 0.45,
    category: "Equity",
    sparkline: [10.0, 9.95, 10.05, 9.98, 10.08, 10.02, 10.10, 10.06, 10.12, 10.09, 10.15, 10.14],
  },
  {
    name: "Edelweiss Multi-Asset",
    amc: "Edelweiss Asset Management",
    nav: 10.61,
    aum: "₹312.55 Cr",
    returns1y: 6.12,
    sharpe: 1.62,
    drawdown: -2.31,
    risk: "MODERATE RISK",
    riskLevel: 0.44,
    category: "Hybrid",
    sparkline: [10.0, 9.7, 10.2, 9.9, 10.4, 10.1, 10.5, 10.3, 10.7, 10.5, 10.8, 10.61],
  },
  {
    name: "IIFL Event-Driven Opportunities",
    amc: "IIFL Asset Management",
    nav: 11.12,
    aum: "₹96.84 Cr",
    returns1y: 11.24,
    sharpe: 1.74,
    drawdown: -1.87,
    risk: "MOD-HIGH RISK",
    riskLevel: 0.62,
    category: "Equity",
    sparkline: [10.0, 10.4, 10.2, 10.7, 10.5, 10.9, 10.7, 11.1, 10.9, 11.3, 11.1, 11.12],
  },
  {
    name: "Motilal Oswal Quant Alpha",
    amc: "Motilal Oswal AMC",
    nav: 10.48,
    aum: "₹184.20 Cr",
    returns1y: 4.82,
    sharpe: 1.58,
    drawdown: -2.05,
    risk: "MODERATE RISK",
    riskLevel: 0.46,
    category: "Equity",
    sparkline: [10.0, 9.8, 10.1, 9.9, 10.2, 10.0, 10.3, 10.2, 10.4, 10.3, 10.5, 10.48],
  },
];

const FILTERS = ["All", "Hybrid", "Equity", "Debt"] as const;
type Filter = (typeof FILTERS)[number];

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, id }: { data: number[]; id: string }) {
  const W = 200, H = 48;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 8) - 4,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  const gradId = `spark-${id}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E4ED8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1E4ED8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke="#1E4ED8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Risk gauge ────────────────────────────────────────────────────────────────
function RiskGauge({ level, label }: { level: number; label: string }) {
  // Gauge is a top semicircle. angle=0 → left (low risk), angle=180 → right (high risk).
  // In SVG: going from left to right through the TOP = clockwise (sweep=1).
  const cx = 44, cy = 44, R = 34, r = 24;

  const pt = (angleDeg: number, radius: number) => ({
    x: +(cx + radius * Math.cos(Math.PI - (angleDeg * Math.PI) / 180)).toFixed(2),
    y: +(cy - radius * Math.sin((angleDeg * Math.PI) / 180)).toFixed(2),
  });

  // sweep=1 on outer (CW = goes through top), sweep=0 on inner (CCW = returns back)
  const seg = (a1: number, a2: number, color: string) => {
    const o1 = pt(a1, R), o2 = pt(a2, R);
    const i1 = pt(a1, r), i2 = pt(a2, r);
    return (
      <path
        d={`M ${o1.x} ${o1.y} A ${R} ${R} 0 0 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${r} ${r} 0 0 0 ${i1.x} ${i1.y} Z`}
        fill={color}
      />
    );
  };

  const needlePt = pt(level * 180, 22);

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <svg viewBox="0 0 88 50" width="88" height="50">
        {seg(0, 55, "#22C55E")}
        {seg(55, 110, "#F59E0B")}
        {seg(110, 180, "#EF4444")}
        <line x1={cx} y1={cy} x2={needlePt.x} y2={needlePt.y}
          stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.5" fill="#0B1F3A" />
      </svg>
      <p className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-muted -mt-1">
        {label}
      </p>
    </div>
  );
}

// ── Fund card ─────────────────────────────────────────────────────────────────
function FundCard({ fund }: { fund: (typeof FUNDS)[0] }) {
  const pos = fund.returns1y >= 0;
  return (
    <div className="bg-white rounded-[16px] border border-rule shadow-card p-5 flex flex-col gap-4 hover:shadow-premium transition-shadow">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14.5px] font-bold text-heading leading-tight">{fund.name}</p>
          <p className="text-[12px] text-muted mt-0.5">By {fund.amc}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[9.5px] font-semibold uppercase tracking-widest text-faint">NAV</p>
          <p className="text-[18px] font-bold text-heading nums leading-tight">₹{fund.nav.toFixed(2)}</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "AUM", value: fund.aum, cls: "text-heading" },
          { label: "1Y RETURNS", value: `${pos ? "+" : ""}${fund.returns1y}%`, cls: pos ? "text-gain font-semibold" : "text-loss font-semibold" },
          { label: "SHARPE", value: fund.sharpe.toFixed(2), cls: "text-heading" },
          { label: "DRAWDOWN", value: `${fund.drawdown.toFixed(2)}%`, cls: "text-loss font-semibold" },
        ].map(({ label, value, cls }) => (
          <div key={label}>
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-1">{label}</p>
            <p className={`text-[14px] nums ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sparkline + Gauge */}
      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <Sparkline data={fund.sparkline} id={fund.name.replace(/\s+/g, "-")} />
        </div>
        <RiskGauge level={fund.riskLevel} label={fund.risk} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 pt-1">
        <a
          href="#"
          className="flex-1 py-2 rounded-full border border-rule text-[13px] font-semibold text-heading text-center hover:border-brand-navy hover:bg-surface"
        >
          Details
        </a>
        <a
          href="#"
          className="flex-1 py-2 rounded-full bg-primary text-white text-[13px] font-semibold text-center hover:bg-primary-hover shadow-btn"
        >
          Invest Now
        </a>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export function TopFunds() {
  const [filter, setFilter] = useState<Filter>("All");

  const visible =
    filter === "All" ? FUNDS : FUNDS.filter((f) => f.category === filter);

  return (
    <section className="bg-surface border-b border-rule">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[32px] lg:text-[38px] font-bold text-heading tracking-tight leading-none mb-2">
              Top Funds
            </h2>
            <p className="text-[14px] text-muted">
              Specialised Investment Funds — live performance &amp; metrics
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* AMC dropdown */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-rule bg-white text-[13px] text-body hover:border-brand-navy">
              All AMCs
              <ChevronDown className="w-3.5 h-3.5 text-muted" strokeWidth={2} />
            </button>

            {/* Category pills */}
            <div className="flex items-center gap-1 bg-white rounded-full border border-rule p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${filter === f
                      ? "bg-primary text-white shadow-btn"
                      : "text-muted hover:text-heading"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((fund) => (
            <FundCard key={fund.name} fund={fund} />
          ))}
          {visible.length === 0 && (
            <p className="col-span-3 text-center py-12 text-muted">No funds in this category yet.</p>
          )}
        </div>

        {/* View all */}
        <div className="flex justify-center mt-8">
          <a
            href="/sifs"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-rule text-[13.5px] font-semibold text-heading hover:border-brand-navy hover:bg-white"
          >
            Load 2 more funds
            <ArrowDown className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
