'use client';

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { useCompareTray } from "@/components/ui/CompareTray";

type View = "Cumulative" | "Drawdown" | "Rolling" | "Volatility";

const PALETTE = ["#14b7a3", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

const PRESETS: { id: string; label: string; icon: string }[] = [
  { id: "top",      label: "Top SI Return",      icon: "↑" },
  { id: "low-risk", label: "Lowest Drawdown",     icon: "↓" },
  { id: "equity",   label: "Equity Funds",        icon: "◆" },
  { id: "hybrid",   label: "Hybrid Funds",        icon: "◆" },
  { id: "sharpe",   label: "Best Sharpe",         icon: "★" },
];

function shortName(name: string) {
  return name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim();
}

function toCumulative(s: number[]) { const b = s[0]; return s.map((v) => ((v - b) / b) * 100); }
function toDrawdown(s: number[]) { let p = s[0]; return s.map((v) => { p = Math.max(p, v); return ((v - p) / p) * 100; }); }
function toRolling(s: number[]) {
  const w = Math.min(12, Math.max(2, Math.floor(s.length / 3)));
  const res = s.map((_, i) => i < w ? 0 : ((s[i] - s[i - w]) / s[i - w]) * 100);
  const firstVal = res[w] || 0;
  for (let i = 0; i < w; i++) res[i] = firstVal;
  return res;
}
function toVolatility(s: number[]) {
  const w = Math.min(6, Math.max(2, Math.floor(s.length / 4)));
  const r = s.map((v, i) => i === 0 ? 0 : (v - s[i - 1]) / s[i - 1]);
  const vols = r.map((_, i) => {
    if (i < w) return 0;
    const win = r.slice(i - w, i);
    const m = win.reduce((a, b) => a + b, 0) / win.length;
    const v = win.reduce((a, b) => a + (b - m) ** 2, 0) / win.length;
    return Math.sqrt(v) * Math.sqrt(252) * 100;
  });
  const firstVal = vols[w] || 0;
  for (let i = 0; i < w; i++) vols[i] = firstVal;
  return vols;
}

function ChartTooltip({ active, payload, view }: any) {
  if (!active || !payload?.length) return null;
  const date: string = payload[0]?.payload?.date ?? "";
  return (
    <div className="bg-[#0B1F3A] rounded-[14px] shadow-premium px-4 py-3 min-w-[200px] border border-white/10">
      {date && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">{date}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any) => {
          const isVol = view === "Volatility";
          const displayVal = isVol
            ? `${entry.value.toFixed(2)}%`
            : `${entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}%`;
          const valColor = isVol
            ? "text-white/90"
            : (entry.value >= 0 ? "text-[#6EF0B6]" : "text-[#FF7070]");
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="size-2 rounded-full shrink-0" style={{ background: entry.color }} />
                <span className="text-[11px] text-white/70 truncate max-w-[130px]">{entry.name}</span>
              </div>
              <span className={`text-[12px] font-bold tabular font-mono shrink-0 ${valColor}`}>
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YTick({ x, y, payload, view }: any) {
  return (
    <text x={x - 6} y={y} dy={4} textAnchor="end"
      style={{ fontSize: 11, fontFamily: "var(--font-sans)", fill: "#555", fontVariantNumeric: "tabular-nums" }}>
      {view === "Volatility"
        ? `${payload.value.toFixed(1)}%`
        : `${payload.value >= 0 ? "+" : ""}${payload.value.toFixed(1)}%`}
    </text>
  );
}

type Props = { funds: FundRow[] };

export function BuildYourCompare({ funds }: Props) {
  const [picked, setPicked] = useState<string[]>(() =>
    [...funds].sort((a, b) => (b.returns["SI"] ?? 0) - (a.returns["SI"] ?? 0)).slice(0, 3).map((f) => f.schemeCode),
  );
  const [period, setPeriod] = useState<PeriodKey>("SI");
  const [view, setView] = useState<View>("Cumulative");
  const [addOpen, setAddOpen] = useState(false);
  const { toggle, has } = useCompareTray();

  const selected = picked.map((id) => funds.find((f) => f.schemeCode === id)!).filter(Boolean);
  const addable = funds.filter((f) => !picked.includes(f.schemeCode));

  const series = useMemo(() => {
    return selected.map((f, i) => {
      const raw = f.sparklines[period];
      const dates = f.sparklineDates[period];
      if (!raw || raw.length < 2) return null;
      let data: number[];
      switch (view) {
        case "Cumulative": data = toCumulative(raw); break;
        case "Drawdown":   data = toDrawdown(raw);   break;
        case "Rolling":    data = toRolling(raw);    break;
        case "Volatility": data = toVolatility(raw); break;
      }
      return { id: f.schemeCode, name: f.fundName || shortName(f.name), color: PALETTE[i % PALETTE.length], data, dates: dates ?? [] };
    }).filter(Boolean) as { id: string; name: string; color: string; data: number[]; dates: string[] }[];
  }, [selected, period, view]);

  const chartData = useMemo(() => {
    if (!series.length) return [];
    const maxLen = Math.max(...series.map((s) => s.data.length));
    const longest = series.reduce((a, b) => a.data.length >= b.data.length ? a : b);
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number | null | string> = { idx: i };
      series.forEach((s) => {
        const offset = maxLen - s.data.length;
        const si = i - offset;
        point[s.id] = si >= 0 ? +s.data[si].toFixed(3) : null;
      });
      point["date"] = longest.dates[i] ?? "";
      return point;
    });
  }, [series]);

  function applyPreset(id: string) {
    const withSI = funds.filter((f) => f.returns["SI"] !== null);
    let next: string[] = [];
    if (id === "top")      next = [...withSI].sort((a, b) => (b.returns["SI"] ?? 0) - (a.returns["SI"] ?? 0)).slice(0, 3).map((f) => f.schemeCode);
    else if (id === "low-risk") next = [...withSI].sort((a, b) => (a.drawdowns["SI"] ?? 0) - (b.drawdowns["SI"] ?? 0)).slice(0, 3).map((f) => f.schemeCode);
    else if (id === "equity")   next = funds.filter((f) => f.category === "Equity").slice(0, 3).map((f) => f.schemeCode);
    else if (id === "hybrid")   next = funds.filter((f) => f.category === "Hybrid").slice(0, 3).map((f) => f.schemeCode);
    else if (id === "sharpe")   next = [...withSI].sort((a, b) => (b.returns["SI"] ?? 0) - (a.returns["SI"] ?? 0) && b.sharpes["SI"] !== null ? (b.sharpes["SI"] ?? 0) - (a.sharpes["SI"] ?? 0) : 0).slice(0, 3).map((f) => f.schemeCode);
    if (next.length) setPicked(next);
  }

  const periods: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];
  const viewLabel = { Cumulative: "% return from start of period", Drawdown: "Peak-to-trough decline", Rolling: "Rolling period return", Volatility: "Annualised volatility" }[view];

  if (funds.length === 0) return null;

  return (
    <section className="bg-[#f8f9fb] py-12 md:py-[84px] px-4 sm:px-6 lg:px-[82px] flex flex-col items-start gap-8 md:gap-[46px] w-full border-b border-rule">
      {/* Section Header */}
      <div className="flex flex-col gap-3 pl-0 lg:pl-[30px] self-stretch w-full max-w-[1320px] mx-auto">
        <p className="text-[15px] font-normal uppercase text-black tracking-[0.2px]">
          Build Your Comparison
        </p>
        <h2 className="text-[24px] font-bold text-black leading-none font-sans">
          Multi-fund performance lab
        </h2>
        <p className="text-[15px] font-normal text-[#555] leading-normal font-sans">
          Select up to 5 SIFs and compare NAV performance across periods.
        </p>
      </div>

      {/* Lab Card */}
      <div className="max-w-[1320px] mx-auto w-full rounded-[17.44px] bg-white shadow-[0_2px_16px_0_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
        {/* Nav bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-[40px] p-4 sm:p-[24px_22px] self-stretch bg-[#ecf4f1] border-b-[1.25px] border-white">
          <div className="flex items-center gap-[4.36px] p-[4.36px] rounded-[24px] bg-white w-full sm:max-w-[348px] box-border">
            {(["Cumulative", "Drawdown", "Rolling", "Volatility"] as const).map((type) => (
              <button
                key={type}
                className={`flex-1 flex items-center justify-center py-[7px] px-1.5 sm:px-[13px] rounded-[24px] border-none text-[11px] sm:text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 ${
                  type === view
                    ? "bg-primary text-white shadow-[0_1.25px_3.74px_0_rgba(0,0,0,0.1),_0_1.25px_2.49px_-1.25px_rgba(0,0,0,0.1)]"
                    : "bg-transparent text-[#6b7280] hover:text-primary"
                }`}
                onClick={() => setView(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-[4.36px] p-[4px] rounded-[24px] bg-white w-full sm:max-w-[237px] box-border">
            {periods.map((p) => (
              <button
                key={p}
                className={`flex-1 flex items-center justify-center py-[7px] px-[13px] rounded-[24px] border-none text-[13px] font-medium cursor-pointer transition-all duration-150 ${
                  p === period
                    ? "bg-primary text-white shadow-[0_1.25px_3.74px_0_rgba(0,0,0,0.1),_0_1.25px_2.49px_-1.25px_rgba(0,0,0,0.1)]"
                    : "bg-transparent text-[#6b7280] hover:text-primary"
                }`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Fund tags */}
        <div className="flex items-center gap-2 p-[14px_22px_10px] overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap border-b border-[#f1f2f4] [-webkit-overflow-scrolling:touch]">
          {selected.map((f, i) => (
            <div key={f.schemeCode} className="flex items-center gap-[6px] py-[6px] px-[10px] rounded-[24px] border-[1.25px] border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] shrink-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="text-[12px] font-medium text-[#374151] whitespace-nowrap">{shortName(f.name)}</span>
              <button
                onClick={() => setPicked(picked.filter((id) => id !== f.schemeCode))}
                className="flex items-center justify-center bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-[#374151] p-0 transition-colors"
                aria-label={`Remove ${f.name}`}
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          {picked.length < 5 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setAddOpen((o) => !o)}
                className="flex items-center gap-[5px] py-[6px] px-[12px] rounded-[24px] border-[1.5px] border-dashed border-[#9ca3af] bg-transparent text-[12px] font-medium text-[#6b7280] hover:border-primary hover:text-primary cursor-pointer transition-all"
              >
                <Plus className="size-3" />
                Add fund
              </button>
              {addOpen && (
                <div className="absolute z-30 top-full mt-2 left-0 w-72 bg-white border border-rule rounded-[14px] shadow-premium p-2 max-h-[280px] overflow-auto">
                  {addable.length === 0 && <div className="px-3 py-2 text-[11px] text-muted">All funds added</div>}
                  {addable.map((f) => (
                    <button
                      key={f.schemeCode}
                      onClick={() => { setPicked([...picked, f.schemeCode]); setAddOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface text-[12px] truncate text-[#374151] font-medium transition-colors"
                    >
                      {shortName(f.name)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chart area */}
        {series.length > 0 && chartData.length > 1 ? (
          <div className="flex items-stretch p-[16px_12px_0] sm:p-[16px_22px_0] gap-0 flex-1 min-h-[280px] sm:min-h-[350px]">
            <div className="flex-1 w-full h-[260px] sm:h-[320px] touch-none select-none overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <defs>
                    {series.map((s) => (
                      <linearGradient key={s.id} id={`bkgrd-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="#F1F2F4" vertical={false} />
                  <XAxis dataKey="idx" tick={false} axisLine={false} tickLine={false} />
                  <YAxis tick={<YTick view={view} />} axisLine={false} tickLine={false} width={48} tickCount={6}
                    domain={([min, max]: readonly (number | string)[]) => {
                      const numMin = typeof min === "number" ? min : parseFloat(min);
                      const numMax = typeof max === "number" ? max : parseFloat(max);
                      const pad = Math.max((numMax - numMin) * 0.1, 1);
                      return [Math.floor(numMin - pad), Math.ceil(numMax + pad)];
                    }}
                    allowDataOverflow={false}
                  />
                  <Tooltip content={<ChartTooltip view={view} />} cursor={{ stroke: "#0B1F3A", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  {view !== "Volatility" && <ReferenceLine y={0} stroke="#B8C7D6" strokeWidth={1} />}
                  {series.map((s) => (
                    <Area key={s.id} type="monotone" dataKey={s.id} name={s.name}
                      stroke={s.color} strokeWidth={2}
                      fill={`url(#bkgrd-${s.id})`}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: s.color }}
                      connectNulls={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-[13px] text-muted">
            Insufficient history for the selected funds and period.
          </div>
        )}

        {/* Legend + source */}
        <div className="flex items-center justify-end flex-wrap gap-2 p-[12px_16px_18px] sm:p-[12px_22px_18px] border-t border-[#f1f2f4] mt-2">
          <span className="text-[#6b7280] text-[11px] font-medium tracking-[0.3px] uppercase">{viewLabel}</span>
          <span className="text-[#d1d5db] text-[11px]">|</span>
          <span className="text-[#6b7280] text-[11px] font-medium tracking-[0.3px] uppercase">AMFI</span>
          <span className="text-[#d1d5db] text-[11px]">|</span>
          <span className="text-[#6b7280] text-[11px] font-medium tracking-[0.3px] uppercase">NAV DATA</span>
        </div>
      </div>

      {/* Presets + compare tray */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full max-w-[1320px] mx-auto pl-0 lg:pl-[30px]">
        {/* Presets bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap w-full sm:w-auto [-webkit-overflow-scrolling:touch]">
          <span className="text-[11px] font-semibold tracking-[0.5px] text-[#9ca3af] uppercase mr-1 shrink-0">PRESETS</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="flex items-center gap-[5px] py-[8px] px-[16px] rounded-[24px] border border-[#e5e7eb] bg-white text-[13px] font-medium text-[#374151] hover:border-primary hover:text-primary cursor-pointer transition-all duration-150 shrink-0 whitespace-nowrap"
            >
              <span className="text-[11px] line-height-1">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Compare Tray buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selected.slice(0, 4).map((f, i) => {
            const inTray = has(f.schemeCode);
            return (
              <button
                key={f.schemeCode}
                onClick={() => toggle(f.schemeCode)}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-[24px] border text-[12px] font-semibold transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer ${
                  inTray
                    ? "border-primary bg-[#ecf4f1] text-primary"
                    : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-primary hover:text-primary"
                }`}
              >
                <span className="size-1.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                {inTray ? "✓ Added" : "+ Compare"}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
