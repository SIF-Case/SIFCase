"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { RiskGauge } from "@/components/ui/RiskMeter";

const FILTERS = ["All", "Hybrid", "Equity"] as const;
type Filter = (typeof FILTERS)[number];

const PERIODS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];

function Sparkline({ data, dates, id }: { data: number[]; dates: string[]; id: string }) {
  const W = 200, H = 56, PAD = 4;
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const fracX = (rawX - PAD) / (W - PAD * 2);
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(fracX * (data.length - 1))));
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 0.01;
    const px = PAD + (idx / (data.length - 1)) * (W - PAD * 2);
    const py = H - PAD - ((data[idx] - min) / range) * (H - PAD * 2);
    setTooltip({ x: px, y: py, idx });
  }, [data]);

  if (data.length < 2) return <div style={{ height: H }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;
  const trending = data[data.length - 1] >= data[0];
  const color = trending ? "#16A34A" : "#DC2626";
  const pts = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;
  const gradId = `spark-${id}`;
  const last = pts[pts.length - 1];

  const tip = tooltip !== null ? tooltip : null;
  const tipDate = tip ? (dates[tip.idx] ?? "") : "";
  const tipNav = tip ? data[tip.idx] : 0;
  // Flip tooltip to left side if near right edge
  const tipAnchorRight = tip && tip.x > W * 0.6;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible cursor-crosshair"
        height={H}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="3" fill={color} />

        {tip && (
          <>
            <line x1={tip.x} y1={PAD} x2={tip.x} y2={H} stroke={color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.5" />
            <circle cx={tip.x} cy={tip.y} r="4" fill="white" stroke={color} strokeWidth="1.8" />
          </>
        )}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 bg-heading text-white text-[10px] font-semibold rounded-md px-2 py-1 leading-snug shadow-lg whitespace-nowrap"
          style={{
            bottom: `${H - tip.y + 10}px`,
            ...(tipAnchorRight
              ? { right: `${(1 - tip.x / W) * 100}%` }
              : { left: `${(tip.x / W) * 100}%` }),
            transform: tipAnchorRight ? "translateX(0)" : "translateX(-50%)",
          }}
        >
          <p className="nums">₹{tipNav.toFixed(4)}</p>
          <p className="text-[9px] font-normal opacity-75">{tipDate}</p>
        </div>
      )}
    </div>
  );
}

function FundCard({ fund, period }: { fund: FundRow; period: PeriodKey }) {
  const periodRet = fund.returns?.[period] ?? null;

  const fmtRet = (v: number | null | undefined) =>
    v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "—";
  const retCls = (v: number | null | undefined) =>
    v != null ? (v >= 0 ? "text-gain font-semibold" : "text-loss font-semibold") : "text-muted";

  return (
    <div className="bg-white rounded-[16px] border border-rule shadow-card p-5 flex flex-col gap-4 hover:shadow-premium transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14.5px] font-bold text-heading leading-tight">{fund.fundName || fund.name}</p>
          <p className="text-[12px] font-medium text-body mt-0.5">{fund.companyName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[9.5px] font-semibold uppercase tracking-widest text-faint">NAV</p>
          <p className="text-[18px] font-bold text-heading nums leading-tight">₹{fund.nav.toFixed(4)}</p>
          <p className="text-[9.5px] font-semibold uppercase tracking-widest text-faint mt-1.5">AUM</p>
          <p className="text-[12px] font-semibold text-muted nums">
            {fund.aum != null
              ? fund.aum >= 1e7
                ? `₹${(fund.aum / 1e7).toFixed(1)}Cr`
                : `₹${(fund.aum / 1e5).toFixed(1)}L`
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-1">{period} RETURN</p>
          <p className={`text-[14px] nums ${retCls(periodRet)}`}>{fmtRet(periodRet)}</p>
        </div>
        <div>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-1">SHARPE</p>
          {(() => {
            const s = fund.sharpes?.[period] ?? null;
            return (
              <p className={`text-[14px] nums font-semibold ${s !== null ? (s >= 1 ? "text-gain" : s >= 0 ? "text-amber-500" : "text-loss") : "text-muted"}`}>
                {s !== null ? s.toFixed(2) : "—"}
              </p>
            );
          })()}
        </div>
        <div>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint mb-1">DRAWDOWN</p>
          {(() => {
            const dd = fund.drawdowns?.[period] ?? null;
            return (
              <p className={`text-[14px] nums font-semibold ${dd === null ? "text-muted" : dd === 0 ? "text-body" : "text-loss"}`}>
                {dd !== null ? `${dd.toFixed(2)}%` : "—"}
              </p>
            );
          })()}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <Sparkline data={fund.sparklines?.[period] ?? []} dates={fund.sparklineDates?.[period] ?? []} id={`${fund.schemeCode}-${period}`} />
        </div>
        {fund.riskBand != null && <RiskGauge level={fund.riskBand} />}
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <a
          href={`/sifs/${fund.schemeCode.toLowerCase()}`}
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

export function TopFunds({ funds }: { funds: FundRow[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [amc, setAmc] = useState<string>("All");
  const [amcOpen, setAmcOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const amcs = ["All", ...Array.from(new Set(funds.map((f) => f.amc))).sort()];

  useEffect(() => {
    if (!amcOpen) return;
    const close = () => setAmcOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [amcOpen]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(6); }, [filter, amc, period]);

  const filtered = funds
    .filter((f) => {
      if (filter !== "All" && f.category !== filter) return false;
      if (amc !== "All" && f.amc !== amc) return false;
      return true;
    })
    .sort((a, b) => {
      const ra = a.returns[period] ?? -Infinity;
      const rb = b.returns[period] ?? -Infinity;
      return rb - ra;
    });
  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="bg-surface border-b border-rule">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Top Funds</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              Best performing SIFs
            </h2>
            <p className="text-[15px] text-muted">
              Regular plan funds ranked by {period === "SI" ? "return since inception" : `${period} return`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-white rounded-full border border-rule p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${period === p ? "bg-primary text-white shadow-btn" : "text-muted hover:text-heading"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="relative">
              <button
                onClick={() => setAmcOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-rule bg-white text-[13px] text-body hover:border-brand-navy"
              >
                {amc === "All" ? "All AMCs" : amc}
                <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${amcOpen ? "rotate-180" : ""}`} strokeWidth={2} />
              </button>
              {amcOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-rule rounded-xl shadow-premium py-1 min-w-[180px]">
                  {amcs.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAmc(a); setAmcOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-surface transition-colors ${amc === a ? "font-semibold text-primary" : "text-body"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 bg-white rounded-full border border-rule p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${filter === f ? "bg-primary text-white shadow-btn" : "text-muted hover:text-heading"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((fund) => (
            <FundCard key={fund.schemeCode} fund={fund} period={period} />
          ))}
          {visible.length === 0 && (
            <p className="col-span-3 text-center py-12 text-muted">No funds in this category.</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover shadow-btn"
            >
              View More ({filtered.length - visibleCount} remaining)
            </button>
          )}
          <a
            href="/sifs"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-rule text-[13.5px] font-semibold text-heading hover:border-brand-navy hover:bg-white"
          >
            View all SIFs
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
