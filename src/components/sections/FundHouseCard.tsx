"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { useCompareTray } from "@/components/ui/CompareTray";
import { RiskMeter, RISK_LABELS } from "@/components/ui/RiskMeter";
import { cn } from "@/lib/utils";

const CHART_PERIODS: PeriodKey[] = ["1M", "3M", "SI"];

function computeVolatility(navs: number[]): number | null {
  if (navs.length < 15) return null;
  const rets: number[] = [];
  for (let i = 1; i < navs.length; i++) rets.push((navs[i] - navs[i - 1]) / navs[i - 1]);
  if (rets.length < 10) return null;
  const n = rets.length;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return +(Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2);
}

function computeYTD(navs: number[], dates: string[]): number | null {
  if (navs.length < 2) return null;
  const latestYear = new Date(dates[dates.length - 1]).getUTCFullYear();
  let startIdx = dates.findIndex((d) => new Date(d).getUTCFullYear() === latestYear);
  if (startIdx === -1) startIdx = 0;
  const base = navs[startIdx];
  const latest = navs[navs.length - 1];
  if (!base) return null;
  return +(((latest - base) / base) * 100).toFixed(2);
}

function computeDayChange(navs: number[]): { change: number; pct: number } | null {
  if (navs.length < 2) return null;
  const prev = navs[navs.length - 2];
  const change = navs[navs.length - 1] - prev;
  if (!prev) return null;
  return { change, pct: (change / prev) * 100 };
}

function formatLaunchDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function curvePath(pts: { x: number; y: number }[]): string {
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

const CATEGORY_BADGE: Record<string, string> = {
  Equity: "bg-[#3BB5A51A] border-[#3BB5A540] text-[#3BB5A5]",
  Hybrid: "bg-[#C9A24B26] border-[#C9A24B40] text-[#C9A24B]",
};

function ReturnStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col gap-0.5 flex-1 min-w-[62px] pr-4 last:pr-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</span>
      <span
        className={cn(
          "text-[16px] font-bold nums",
          value === null ? "text-muted" : value >= 0 ? "text-gain" : "text-loss"
        )}
      >
        {value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`}
      </span>
    </div>
  );
}

function MetricItem({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={cn("text-[13px] font-semibold", negative ? "text-loss" : "text-heading")}>{value}</span>
    </div>
  );
}

// ─── NAV mini-chart (styled to match FundDetailPanel's chart language) ────────

function NavMiniChart({ data, dates }: { data: number[]; dates: string[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 480, H = 120, PL = 40, PR = 8, PT = 10, PB = 18;

  const { linePath, areaPath, pts, chartMin, chartMax } = useMemo(() => {
    if (data.length < 2) return { linePath: "", areaPath: "", pts: [] as { x: number; y: number }[], chartMin: 0, chartMax: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 0.01;
    const p = data.map((v, i) => ({
      x: PL + (i / (data.length - 1)) * (W - PL - PR),
      y: PT + ((max - v) / range) * (H - PT - PB),
    }));
    const line = curvePath(p);
    const area = `${line} L ${p[p.length - 1].x.toFixed(1)} ${H - PB} L ${p[0].x.toFixed(1)} ${H - PB} Z`;
    return { linePath: line, areaPath: area, pts: p, chartMin: min, chartMax: max };
  }, [data]);

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || pts.length < 2) return;
      const rect = svg.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * W;
      const frac = (rawX - PL) / (W - PL - PR);
      const idx = Math.min(pts.length - 1, Math.max(0, Math.round(frac * (pts.length - 1))));
      setTip({ x: pts[idx].x, y: pts[idx].y, idx });
    },
    [pts]
  );

  const handleTouch = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || pts.length < 2) return;
      const rect = svg.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const rawX = ((touch.clientX - rect.left) / rect.width) * W;
      const frac = (rawX - PL) / (W - PL - PR);
      const idx = Math.min(pts.length - 1, Math.max(0, Math.round(frac * (pts.length - 1))));
      setTip({ x: pts[idx].x, y: pts[idx].y, idx });
    },
    [pts]
  );

  if (data.length < 2) {
    return <div className="h-full flex items-center justify-center text-[12px] text-faint">Insufficient data</div>;
  }

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full cursor-crosshair overflow-visible select-none"
        style={{ touchAction: "none" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setTip(null)}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={() => setTip(null)}
      >
        <defs>
          <linearGradient id="nav-mini-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E9F8E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0E9F8E" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {Array.from({ length: 3 }, (_, i) => {
          const v = chartMin + ((chartMax - chartMin || 0.01) * i) / 2;
          const y = PT + ((chartMax - v) / (chartMax - chartMin || 0.01)) * (H - PT - PB);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray={i === 1 ? "3 3" : undefined} />
              <text x={PL - 6} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end">
                ₹{v.toFixed(2)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#nav-mini-grad)" />
        <path d={linePath} fill="none" stroke="#0E9F8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {tip && (
          <>
            <line x1={tip.x} y1={PT} x2={tip.x} y2={H - PB} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.6" />
            <circle cx={tip.x} cy={tip.y} r="3.5" fill="white" stroke="#0E9F8E" strokeWidth="2" />
          </>
        )}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 bg-heading text-white text-[11px] font-semibold rounded-lg px-2.5 py-1.5 shadow-premium whitespace-nowrap"
          style={{
            bottom: `${H - tip.y + 10}px`,
            left: `${Math.min(Math.max((tip.x / W) * 100, 12), 88)}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="nums">₹{data[tip.idx].toFixed(4)}</p>
          <p className="text-[9px] font-normal opacity-70">{dates[tip.idx]}</p>
        </div>
      )}
    </div>
  );
}

export function FundHouseCard({ fund, active = true }: { fund: FundRow; active?: boolean }) {
  const [period, setPeriod] = useState<PeriodKey>("SI");
  const { has, toggle } = useCompareTray();
  const inTray = has(fund.schemeCode);

  const spark = fund.sparklines[period];
  const sparkDates = fund.sparklineDates[period];
  const ytd = computeYTD(fund.sparklines.SI, fund.sparklineDates.SI);
  const volatility = computeVolatility(fund.sparklines.SI);
  const riskBand = fund.riskBand;
  const dayChange = computeDayChange(fund.sparklines.SI);
  const launchLabel = formatLaunchDate(fund.sparklineDates.SI[0]);

  return (
    <div className="rounded-[14px] border border-rule bg-white overflow-hidden shadow-card">
      {/* Header */}
      <div className="bg-[#1B2A3B] px-5 py-2.5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            {active && (
              <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-semibold bg-[#1A9E5F1A] text-[#4ADE80] border border-[#4ADE8033]">
                <span className="size-1.5 rounded-full bg-[#4ADE80]" /> Active
              </span>
            )}
            <span className={cn("px-2 py-[3px] rounded-full text-[10px] font-semibold border", CATEGORY_BADGE[fund.category] ?? CATEGORY_BADGE.Equity)}>
              {fund.category}
            </span>
            {/[- ]long[- ]?short/i.test(fund.strategy) && (
              <span className="px-2 py-[3px] rounded-full text-[10px] font-semibold bg-white/[0.07] border border-white/10 text-white/55">
                Long-Short
              </span>
            )}
            {fund.schemeCode && (
              <span className="px-2 py-[3px] rounded-full text-[9.5px] font-semibold bg-white/[0.06] border border-white/[0.09] text-white/40">
                {fund.schemeCode}
              </span>
            )}
          </div>
          <h3 className="text-[16px] font-bold text-white leading-tight tracking-tight">{fund.fundName}</h3>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="block text-[20px] font-extrabold text-white nums">₹{fund.nav.toFixed(4)}</span>
          {dayChange && (
            <span className={cn("block text-[12px] font-semibold nums mt-0.5", dayChange.change >= 0 ? "text-gain" : "text-loss")}>
              {dayChange.change >= 0 ? "+" : ""}₹{dayChange.change.toFixed(4)} ({dayChange.pct >= 0 ? "+" : ""}
              {dayChange.pct.toFixed(2)}%)
            </span>
          )}
        </div>
      </div>

      {/* NAV chart */}
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">NAV History · Source: AMFI</span>
          <div className="flex items-center gap-1">
            {CHART_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-[11px] py-[5px] rounded-[6px] border text-[12px] font-medium transition-colors",
                  period === p
                    ? "bg-[#0E9F8E] text-white border-[#0E9F8E]"
                    : "bg-white border-[#E2E8EE] text-[#6B8299] hover:text-[#3D5166]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[120px]">
          <NavMiniChart data={spark} dates={sparkDates} />
        </div>
      </div>

      {/* Returns strip + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-rule">
        <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <ReturnStat label="YTD" value={ytd} />
          <ReturnStat label="1M" value={fund.returns["1M"]} />
          <ReturnStat label="3M" value={fund.returns["3M"]} />
          <ReturnStat label="6M" value={fund.returns["6M"]} />
          <ReturnStat label="Since Inception" value={fund.returns["SI"]} />
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <Link
            href={`/sifs/${fund.schemeCode.toLowerCase()}`}
            className="flex-1 sm:flex-none h-9 px-4 inline-flex items-center justify-center rounded-[8px] bg-primary text-white text-[14px] font-semibold hover:bg-primary-hover transition-colors whitespace-nowrap"
          >
            View Details →
          </Link>
          <button
            onClick={() => toggle(fund.schemeCode)}
            aria-pressed={inTray}
            className={cn(
              "flex-1 sm:flex-none h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-[8px] border text-[14px] font-medium transition-colors whitespace-nowrap",
              inTray ? "border-primary bg-primary/10 text-primary" : "border-rule-strong text-muted hover:bg-surface hover:text-body"
            )}
          >
            {inTray ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} Compare
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center flex-wrap gap-x-5 gap-y-2 px-5 py-3 border-t border-rule bg-surface">
        {riskBand != null && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted">SEBI Risk Band</span>
            <RiskMeter level={riskBand} size="sm" />
            <span className="text-[13px] font-semibold text-heading">{RISK_LABELS[riskBand - 1]} ({riskBand})</span>
          </div>
        )}
        <MetricItem label="Sharpe" value={fund.sharpes.SI === null ? "—" : fund.sharpes.SI.toFixed(2)} />
        <MetricItem label="Volatility" value={volatility === null ? "—" : `${volatility.toFixed(2)}%`} />
        <MetricItem label="AUM" value={fund.aum === null ? "—" : `₹${fund.aum.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`} />
        <MetricItem
          label="Max DD"
          value={fund.drawdowns.SI === null ? "—" : `${fund.drawdowns.SI.toFixed(2)}%`}
          negative={fund.drawdowns.SI !== null && fund.drawdowns.SI < 0}
        />
      </div>
    </div>
  );
}