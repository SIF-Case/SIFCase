"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import type { FundDetail, PeriodKey } from "@/lib/sifData";
import { toCumulative } from "@/lib/categoryAverages";

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

function curvePath(pts: { x: number; y: number }[]): string {
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

type CategoryAvgSeries = Record<PeriodKey, { data: number[]; dates: string[] } | null>;

export function FundDetailPanel({
  fund,
  header,
  categoryAvg,
  categoryLabel,
}: {
  fund: FundDetail;
  header?: React.ReactNode;
  categoryAvg?: CategoryAvgSeries;
  categoryLabel?: string;
}) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("All");
  const [showCategoryAvg, setShowCategoryAvg] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 800, H = 220, PL = 48, PR = 12, PT = 16, PB = 30;

  const visible = useMemo(
    () => getSlice(fund.navHistory, chartPeriod),
    [fund.navHistory, chartPeriod]
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

  const avgSeries = categoryAvg?.[periodKey] ?? null;
  const canShowAvg = showCategoryAvg && !!avgSeries && avgSeries.data.length >= 2 && visible.length >= 2;

  // Chart path
  let linePath = "";
  let areaPath = "";
  let pts: { x: number; y: number }[] = [];
  let avgLinePath = "";
  let avgPts: { x: number; y: number }[] = [];
  let chartMin = 0;
  let chartMax = 0;
  let fundPctValues: number[] | null = null;
  let avgPctValues: number[] | null = null;

  if (visible.length >= 2) {
    if (canShowAvg) {
      const fundPct = toCumulative(visible.map((h) => h.nav));
      const avgPct = avgSeries!.data;
      fundPctValues = fundPct;
      avgPctValues = avgPct;
      chartMin = Math.min(...fundPct, ...avgPct);
      chartMax = Math.max(...fundPct, ...avgPct);
      const range = chartMax - chartMin || 0.01;
      const buildPts = (arr: number[]) =>
        arr.map((v, i) => ({
          x: PL + (i / (arr.length - 1)) * (W - PL - PR),
          y: PT + ((chartMax - v) / range) * (H - PT - PB),
        }));
      pts = buildPts(fundPct);
      avgPts = buildPts(avgPct);
      linePath = curvePath(pts);
      avgLinePath = curvePath(avgPts);
      areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PB} L ${pts[0].x.toFixed(1)} ${H - PB} Z`;
    } else {
      const navs = visible.map((h) => h.nav);
      chartMin = Math.min(...navs);
      chartMax = Math.max(...navs);
      const range = chartMax - chartMin || 0.01;
      pts = visible.map((_, i) => ({
        x: PL + (i / (visible.length - 1)) * (W - PL - PR),
        y: PT + ((chartMax - visible[i].nav) / range) * (H - PT - PB),
      }));
      linePath = curvePath(pts);
      areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PB} L ${pts[0].x.toFixed(1)} ${H - PB} Z`;
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || pts.length < 2) return;
      const rect = svg.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * W;
      const fracX = (rawX - PL) / (W - PL - PR);
      const idx = Math.min(pts.length - 1, Math.max(0, Math.round(fracX * (pts.length - 1))));
      setTooltip({ x: pts[idx].x, y: pts[idx].y, idx });
    },
    [pts]
  );

  const tip = tooltip;
  const tipAnchorRight = tip ? tip.x > W * 0.65 : false;

  return (
    <div className="space-y-6">
      {/* Header + period selector */}
      <div className="flex items-start justify-between gap-3">
        {header}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {avgSeries && (
            <button
              onClick={() => { setShowCategoryAvg((v) => !v); setTooltip(null); }}
              className={`h-[30px] px-3 inline-flex items-center rounded-full border text-[12px] font-semibold transition-colors ${
                showCategoryAvg ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-muted border-rule hover:text-body hover:border-rule-strong"
              }`}
            >
              Category Avg
            </button>
          )}
          <div className="flex items-center gap-1 bg-surface rounded-full border border-rule p-1">
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
      </div>

      {canShowAvg && (
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#1E4ED8]" /> {fund.fundName}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-[#94A3B8]" /> {categoryLabel ?? fund.strategy} avg
          </span>
        </div>
      )}

      {/* Chart */}
      <div>
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
                  const TICKS = 4;
                  return Array.from({ length: TICKS + 1 }, (_, i) => {
                    const v = chartMin + ((chartMax - chartMin || 0.01) * i) / TICKS;
                    const y = PT + ((chartMax - v) / (chartMax - chartMin || 0.01)) * (H - PT - PB);
                    return (
                      <g key={i}>
                        <line
                          x1={PL} y1={y} x2={W - PR} y2={y}
                          stroke="#E2E8F0" strokeWidth="1"
                          strokeDasharray={i === 0 || i === TICKS ? undefined : "3 3"}
                        />
                        <text x={PL - 6} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end">
                          {canShowAvg ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : `₹${v.toFixed(4)}`}
                        </text>
                      </g>
                    );
                  });
                })()}

                {/* X-axis ticks + date labels */}
                {(() => {
                  const TICKS = 6;
                  const spanDays =
                    (new Date(visible[visible.length - 1].date).getTime() - new Date(visible[0].date).getTime()) /
                    (1000 * 60 * 60 * 24);

                  // Group data indices by their axis label (e.g. distinct months/days)
                  // so we can pick evenly-spaced *labels* rather than evenly-spaced
                  // *indices* (the latter can land mid-label and get deduped,
                  // producing uneven gaps between the labels actually shown).
                  const firstIdxByLabel: number[] = [];
                  let lastLabel = "";
                  visible.forEach((h, idx) => {
                    const label = fmtAxisDate(h.date, spanDays);
                    if (label !== lastLabel) {
                      firstIdxByLabel.push(idx);
                      lastLabel = label;
                    }
                  });

                  const count = Math.min(TICKS, firstIdxByLabel.length);
                  if (count < 2) return null;

                  return Array.from({ length: count }, (_, i) => {
                    const pos = Math.round((i / (count - 1)) * (firstIdxByLabel.length - 1));
                    const idx = firstIdxByLabel[pos];
                    const x = PL + (idx / (visible.length - 1)) * (W - PL - PR);
                    const label = fmtAxisDate(visible[idx].date, spanDays);
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
                {canShowAvg && (
                  <path
                    d={avgLinePath}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
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
                    {/* Vertical crosshair */}
                    <line
                      x1={tip.x} y1={PT} x2={tip.x} y2={H - PB}
                      stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.6"
                    />
                    {/* Horizontal crosshair */}
                    <line
                      x1={PL} y1={tip.y} x2={W - PR} y2={tip.y}
                      stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.6"
                    />
                    {/* Y-axis value badge */}
                    {(() => {
                      const v = canShowAvg && fundPctValues
                        ? fundPctValues[tip.idx]
                        : visible[tip.idx].nav;
                      const label = canShowAvg
                        ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
                        : `₹${v.toFixed(4)}`;
                      const boxW = label.length * 5.6 + 10;
                      return (
                        <g>
                          <rect
                            x={2} y={tip.y - 8} width={boxW} height={16} rx={3}
                            fill="#1E4ED8"
                          />
                          <text x={2 + boxW / 2} y={tip.y + 3} fontSize="9" fontWeight="700" fill="white" textAnchor="middle">
                            {label}
                          </text>
                        </g>
                      );
                    })()}
                    {/* X-axis date badge */}
                    {(() => {
                      const label = visible[tip.idx].date.slice(5);
                      const boxW = label.length * 5.6 + 10;
                      const bx = Math.min(Math.max(tip.x - boxW / 2, PL), W - PR - boxW);
                      return (
                        <g>
                          <rect
                            x={bx} y={H - PB} width={boxW} height={14} rx={3}
                            fill="#1E4ED8"
                          />
                          <text x={bx + boxW / 2} y={H - PB + 10} fontSize="9" fontWeight="700" fill="white" textAnchor="middle">
                            {label}
                          </text>
                        </g>
                      );
                    })()}
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
                  {canShowAvg && fundPctValues ? (
                    <>
                      <p className="nums">{fundPctValues[tip.idx] >= 0 ? "+" : ""}{fundPctValues[tip.idx].toFixed(2)}%</p>
                      {avgPctValues && (
                        <p className="nums text-[10px] font-normal opacity-70">
                          avg {avgPctValues[Math.min(tip.idx, avgPctValues.length - 1)] >= 0 ? "+" : ""}
                          {avgPctValues[Math.min(tip.idx, avgPctValues.length - 1)].toFixed(2)}%
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="nums">₹{visible[tip.idx].nav.toFixed(4)}</p>
                  )}
                  <p className="text-[9px] font-normal opacity-70">{visible[tip.idx].date}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
