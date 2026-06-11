"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { FundDetail, PeriodKey } from "@/lib/sifData";

type ChartPeriod = "1M" | "3M" | "6M" | "1Y" | "All";
const CHART_PERIODS: ChartPeriod[] = ["1M", "3M", "6M", "1Y", "All"];

function subMonthsClient(date: Date, months: number): Date {
  const d = new Date(date);
  const target = d.getMonth() - months;
  d.setMonth(target);
  const expected = ((target % 12) + 12) % 12;
  if (d.getMonth() !== expected) d.setDate(0);
  return d;
}

function getSlice(
  history: { date: string; nav: number }[],
  period: ChartPeriod
): { date: string; nav: number }[] {
  if (period === "All" || history.length === 0) return history;
  const latest = new Date(history[history.length - 1].date);
  const months = period === "1M" ? 1 : period === "3M" ? 3 : period === "6M" ? 6 : 12;
  const cutoff = subMonthsClient(latest, months);
  let idx = -1;
  for (let i = 0; i < history.length; i++) {
    if (new Date(history[i].date) <= cutoff) idx = i;
    else break;
  }
  return idx >= 0 ? history.slice(idx) : history;
}

function fmtAxisDate(dateStr: string, spanDays: number): string {
  const d = new Date(dateStr);
  if (spanDays <= 60) return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  if (spanDays <= 730) return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return d.toLocaleDateString("en-US", { year: "numeric" });
}

function fmtNum(v: number | null): string {
  if (v === null) return "—";
  return v.toFixed(2);
}

export function FundDetailPanel({ fund, header }: { fund: FundDetail; header?: React.ReactNode }) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("All");
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 800, H = 220, PL = 48, PR = 12, PT = 16, PB = 30;

  const visible = useMemo(
    () => getSlice(fund.navHistory, chartPeriod),
    [fund.navHistory, chartPeriod]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || visible.length < 2) return;
      const rect = svg.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * W;
      const fracX = (rawX - PL) / (W - PL - PR);
      const idx = Math.min(visible.length - 1, Math.max(0, Math.round(fracX * (visible.length - 1))));
      const navs = visible.map((h) => h.nav);
      const min = Math.min(...navs), max = Math.max(...navs);
      const range = max - min || 0.01;
      const px = PL + (idx / (visible.length - 1)) * (W - PL - PR);
      const py = PT + ((max - visible[idx].nav) / range) * (H - PT - PB);
      setTooltip({ x: px, y: py, idx });
    },
    [visible]
  );

  const periodKey: PeriodKey = chartPeriod === "All" ? "SI" : (chartPeriod as PeriodKey);

  const RISK_ROWS: { label: string; value: string; cls: string }[] = [
    {
      label: "Sharpe Ratio",
      value: fmtNum(fund.sharpes[periodKey]),
      cls: (() => {
        const s = fund.sharpes[periodKey];
        return s === null ? "text-muted" : s >= 1 ? "text-gain" : s >= 0 ? "text-caution" : "text-loss";
      })(),
    },
    {
      label: "Volatility",
      value: fund.volatilities[periodKey] !== null ? `${fund.volatilities[periodKey]!.toFixed(2)}%` : "—",
      cls: "text-body",
    },
    {
      label: "Max Drawdown",
      value: fund.drawdowns[periodKey] !== null ? `${fund.drawdowns[periodKey]!.toFixed(2)}%` : "—",
      cls: fund.drawdowns[periodKey] !== null && fund.drawdowns[periodKey]! < 0 ? "text-loss" : "text-muted",
    },
    { label: "Alpha", value: "—", cls: "text-muted" },
    { label: "Beta", value: "—", cls: "text-muted" },
  ];

  // Chart path
  let linePath = "";
  let areaPath = "";
  let pts: { x: number; y: number }[] = [];

  if (visible.length >= 2) {
    const navs = visible.map((h) => h.nav);
    const min = Math.min(...navs), max = Math.max(...navs);
    const range = max - min || 0.01;
    pts = visible.map((_, i) => ({
      x: PL + (i / (visible.length - 1)) * (W - PL - PR),
      y: PT + ((max - visible[i].nav) / range) * (H - PT - PB),
    }));
    linePath = pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpx = ((prev.x + p.x) / 2).toFixed(1);
      return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, "");
    areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PB} L ${pts[0].x.toFixed(1)} ${H - PB} Z`;
  }

  const tip = tooltip;
  const tipAnchorRight = tip ? tip.x > W * 0.65 : false;

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex items-start justify-between gap-3">
        {header}
        <div className="flex items-center gap-1 bg-surface rounded-full border border-rule p-1 shrink-0">
          {CHART_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => { setChartPeriod(p); setTooltip(null); }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${chartPeriod === p ? "bg-primary text-white shadow-btn" : "text-muted hover:text-heading"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart + risk metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Chart */}
        <div className="bg-white rounded-[18px] border border-rule shadow-card p-5">
          {visible.length < 2 ? (
            <div className="flex items-center justify-center h-48 text-muted text-sm">
              Insufficient data for this period
            </div>
          ) : (
            <div className="relative">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full overflow-visible cursor-crosshair"
                style={{ height: H }}
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTooltip(null)}
              >
                <defs>
                  <linearGradient id="fund-detail-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E4ED8" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#1E4ED8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Y-axis gridlines + labels */}
                {(() => {
                  const navs = visible.map((h) => h.nav);
                  const min = Math.min(...navs), max = Math.max(...navs);
                  const range = max - min || 0.01;
                  const TICKS = 4;
                  return Array.from({ length: TICKS + 1 }, (_, i) => {
                    const v = min + (range * i) / TICKS;
                    const y = PT + ((max - v) / range) * (H - PT - PB);
                    return (
                      <g key={i}>
                        <line
                          x1={PL} y1={y} x2={W - PR} y2={y}
                          stroke="#E2E8F0" strokeWidth="1"
                          strokeDasharray={i === 0 || i === TICKS ? undefined : "3 3"}
                        />
                        <text x={PL - 6} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end">
                          ₹{v.toFixed(4)}
                        </text>
                      </g>
                    );
                  });
                })()}

                {/* X-axis ticks + date labels */}
                {(() => {
                  const TICKS = 6;
                  const count = Math.min(TICKS, visible.length);
                  if (count < 2) return null;
                  const spanDays =
                    (new Date(visible[visible.length - 1].date).getTime() - new Date(visible[0].date).getTime()) /
                    (1000 * 60 * 60 * 24);
                  let lastLabel = "";
                  return Array.from({ length: count }, (_, i) => {
                    const idx = Math.round((i / (count - 1)) * (visible.length - 1));
                    const x = PL + (idx / (visible.length - 1)) * (W - PL - PR);
                    const label = fmtAxisDate(visible[idx].date, spanDays);
                    if (label === lastLabel) return null;
                    lastLabel = label;
                    return (
                      <g key={i}>
                        <line x1={x} y1={H - PB} x2={x} y2={H - PB + 4} stroke="#CBD5E1" strokeWidth="1" />
                        <text
                          x={x}
                          y={H - 6}
                          fontSize="9"
                          fill="#94A3B8"
                          textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}
                        >
                          {label}
                        </text>
                      </g>
                    );
                  });
                })()}

                <path d={areaPath} fill="url(#fund-detail-grad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1E4ED8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {tip && (
                  <>
                    <line
                      x1={tip.x} y1={PT} x2={tip.x} y2={H - PB}
                      stroke="#1E4ED8" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.4"
                    />
                    <circle cx={tip.x} cy={tip.y} r="4" fill="white" stroke="#1E4ED8" strokeWidth="2" />
                  </>
                )}
              </svg>

              {tip && (
                <div
                  className="pointer-events-none absolute z-10 bg-heading text-white text-[11px] font-semibold rounded-lg px-2.5 py-1.5 shadow-premium whitespace-nowrap"
                  style={{
                    bottom: `${H - tip.y + 12}px`,
                    ...(tipAnchorRight
                      ? { right: `${(1 - tip.x / W) * 100}%` }
                      : { left: `${(tip.x / W) * 100}%` }),
                    transform: tipAnchorRight ? "translateX(0)" : "translateX(-50%)",
                  }}
                >
                  <p className="nums">₹{visible[tip.idx].nav.toFixed(4)}</p>
                  <p className="text-[9px] font-normal opacity-70">{visible[tip.idx].date}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Risk metrics panel */}
        <div className="bg-white rounded-[18px] border border-rule shadow-card p-5 flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-3">
            Risk-adjusted metrics · {chartPeriod}
          </p>
          {RISK_ROWS.map(({ label, value, cls }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-rule-soft last:border-0">
              <span className="text-[13px] text-body">{label}</span>
              <span className={`text-[14px] font-bold nums ${cls}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
