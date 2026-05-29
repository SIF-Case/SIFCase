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

function fmt(v: number | null, suffix = "%"): string {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}${suffix}`;
}
function fmtNum(v: number | null): string {
  if (v === null) return "—";
  return v.toFixed(2);
}

export function FundDetailPanel({ fund }: { fund: FundDetail }) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("All");
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 800, H = 200, PL = 10, PR = 10, PT = 16, PB = 30;

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
  const periodReturn =
    chartPeriod === "All" ? fund.returns.SI : fund.returns[chartPeriod as "1M" | "3M" | "6M" | "1Y"];

  const retCls = (v: number | null) =>
    v === null ? "text-muted" : v >= 0 ? "text-gain" : "text-loss";

  const RETURN_COLS: { label: string; value: number | null }[] = [
    { label: "YTD", value: fund.returns.YTD },
    { label: "1M", value: fund.returns["1M"] },
    { label: "3M", value: fund.returns["3M"] },
    { label: "6M", value: fund.returns["6M"] },
    { label: "1Y", value: fund.returns["1Y"] },
    { label: "Since Inception", value: fund.returns.SI },
  ];

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
      {/* Period selector + chart label */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Performance · Live NAV</p>
        <div className="flex items-center gap-1 bg-surface rounded-full border border-rule p-1">
          {CHART_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => { setChartPeriod(p); setTooltip(null); }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                chartPeriod === p ? "bg-primary text-white shadow-btn" : "text-muted hover:text-heading"
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
                <path d={areaPath} fill="url(#fund-detail-grad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1E4ED8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Y-axis min/max */}
                {(() => {
                  const navs = visible.map((h) => h.nav);
                  const min = Math.min(...navs), max = Math.max(...navs);
                  return (
                    <>
                      <text x={PL} y={PT + 5} fontSize="9" fill="#94A3B8">₹{max.toFixed(4)}</text>
                      <text x={PL} y={H - PB - 3} fontSize="9" fill="#94A3B8">₹{min.toFixed(4)}</text>
                    </>
                  );
                })()}

                {/* X-axis dates */}
                <text x={PL} y={H - 6} fontSize="9" fill="#94A3B8">{visible[0].date}</text>
                <text x={W - PR} y={H - 6} fontSize="9" fill="#94A3B8" textAnchor="end">
                  {visible[visible.length - 1].date}
                </text>

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

          {/* Return summary row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5 pt-5 border-t border-rule">
            {RETURN_COLS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-faint mb-1">{label}</p>
                <p className={`text-[13px] font-bold nums ${retCls(value)}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
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
