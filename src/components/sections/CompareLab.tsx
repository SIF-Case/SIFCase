'use client';

import { useMemo, useState, useEffect } from "react";
import { Plus, X, Bookmark, Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
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

export const COMPARE_PALETTE = ["#1E4ED8", "#0FAF75", "#F59E0B", "#DC2626", "#6366F1"];

type View = "Cumulative" | "Drawdown" | "Rolling" | "Volatility";

function toCumulative(s: number[]) { const b = s[0]; return s.map((v) => ((v - b) / b) * 100); }
function toDrawdown(s: number[]) { let p = s[0]; return s.map((v) => { p = Math.max(p, v); return ((v - p) / p) * 100; }); }
function toRolling(s: number[]) { const w = Math.min(12, Math.max(2, Math.floor(s.length / 3))); return s.map((_, i) => i < w ? 0 : ((s[i] - s[i - w]) / s[i - w]) * 100); }
function toVolatility(s: number[]) {
  const w = Math.min(6, Math.max(2, Math.floor(s.length / 4)));
  const r = s.map((v, i) => i === 0 ? 0 : (v - s[i - 1]) / s[i - 1]);
  return r.map((_, i) => { if (i < w) return 0; const win = r.slice(i - w, i); const m = win.reduce((a, b) => a + b, 0) / win.length; const v = win.reduce((a, b) => a + (b - m) ** 2, 0) / win.length; return Math.sqrt(v) * Math.sqrt(252) * 100; });
}

function shortName(name: string) {
  return name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim();
}

// Custom tooltip
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const date: string = payload[0]?.payload?.date ?? "";
  return (
    <div className="bg-brand-navy rounded-[14px] shadow-premium px-4 py-3 min-w-[200px] border border-white/10">
      {date && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">{date}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full shrink-0" style={{ background: entry.color }} />
              <span className="text-[11px] text-white/70 truncate max-w-[130px]">{entry.name}</span>
            </div>
            <span className={`text-[12px] font-bold tabular font-mono shrink-0 ${
              entry.value >= 0 ? "text-[#6EF0B6]" : "text-[#FF7070]"
            }`}>
              {entry.value >= 0 ? "+" : ""}{entry.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Y-axis tick
function YTick({ x, y, payload }: any) {
  return (
    <text x={x - 6} y={y} dy={4} textAnchor="end"
      style={{ fontSize: 11, fontFamily: "var(--font-sans)", fill: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>
      {payload.value >= 0 ? "+" : ""}{payload.value.toFixed(1)}%
    </text>
  );
}

type Props = {
  funds: FundRow[];
  initialPicked?: string[];
  controlled?: boolean;
};

export function CompareLab({ funds, initialPicked, controlled }: Props) {
  const [picked, setPicked] = useState<string[]>(() =>
    initialPicked?.length ? initialPicked : funds.slice(0, 3).map((f) => f.schemeCode),
  );

  useEffect(() => {
    if (controlled && initialPicked) setPicked(initialPicked);
  }, [controlled, initialPicked?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const [period, setPeriod] = useState<PeriodKey>("SI");
  const [view, setView] = useState<View>("Cumulative");
  const [addOpen, setAddOpen] = useState(false);

  const selected = picked.map((id) => funds.find((f) => f.schemeCode === id)!).filter(Boolean);
  const addable = funds.filter((f) => !picked.includes(f.schemeCode));

  // Build unified chart data — right-aligned so every series ends at the rightmost point
  const series = useMemo(() => {
    return selected.map((f, i) => {
      const raw = f.sparklines[period];
      const dates = f.sparklineDates[period];
      if (!raw || raw.length < 2) return null;
      let data: number[];
      switch (view) {
        case "Cumulative": data = toCumulative(raw); break;
        case "Drawdown": data = toDrawdown(raw); break;
        case "Rolling": data = toRolling(raw); break;
        case "Volatility": data = toVolatility(raw); break;
      }
      return {
        id: f.schemeCode,
        name: f.fundName || shortName(f.name),
        color: COMPARE_PALETTE[i % COMPARE_PALETTE.length],
        data,
        dates: dates ?? [],
      };
    }).filter(Boolean) as { id: string; name: string; color: string; data: number[]; dates: string[] }[];
  }, [selected, period, view]);

  const chartData = useMemo(() => {
    if (!series.length) return [];
    const maxLen = Math.max(...series.map((s) => s.data.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number | null | string> = { idx: i };
      series.forEach((s) => {
        const offset = maxLen - s.data.length;
        const si = i - offset;
        point[s.id] = si >= 0 ? +s.data[si].toFixed(3) : null;
        if (si >= 0 && s.dates[si]) point[`${s.id}_date`] = s.dates[si];
      });
      // Use the date of the longest series as the row's label date
      const longest = series.reduce((a, b) => a.data.length >= b.data.length ? a : b);
      point["date"] = longest.dates[i] ?? "";
      return point;
    });
  }, [series]);

  const periods: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];

  const viewLabel = {
    Cumulative: "% return indexed to start of period",
    Drawdown: "Peak-to-trough decline from NAV high",
    Rolling: "Rolling period return",
    Volatility: "Annualised volatility (rolling window)",
  }[view];

  return (
    <div className="bg-white border border-rule rounded-[18px] overflow-hidden flex flex-col shadow-card">

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-rule flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {!controlled && (
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary">Performance Lab</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-heading">Multi-fund NAV visualiser</h3>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <Toggle active={view} options={["Cumulative", "Drawdown", "Rolling", "Volatility"] as const} onChange={setView} />
          <Toggle active={period} options={periods} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Fund chips (standalone mode only) ───────────────────────────── */}
      {!controlled && (
        <div className="px-6 py-3 border-b border-rule flex flex-wrap items-center gap-2">
          {selected.map((f, i) => (
            <span key={f.schemeCode} className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-surface border border-rule text-[11px]">
              <span className="size-2 rounded-full shrink-0" style={{ background: COMPARE_PALETTE[i % COMPARE_PALETTE.length] }} />
              <span className="max-w-[160px] truncate text-body">{shortName(f.name)}</span>
              <button onClick={() => setPicked(picked.filter((id) => id !== f.schemeCode))} className="p-0.5 rounded-full hover:bg-rule transition-colors">
                <X className="size-3 text-muted" />
              </button>
            </span>
          ))}
          {picked.length < 5 && (
            <div className="relative">
              <button onClick={() => setAddOpen((o) => !o)} className="h-7 px-3 inline-flex items-center gap-1 rounded-full border border-dashed border-rule bg-white text-[11px] text-muted hover:text-body hover:border-rule-strong transition-colors">
                <Plus className="size-3" /> Add fund
              </button>
              {addOpen && (
                <div className="absolute z-30 top-full mt-2 left-0 w-72 bg-white border border-rule rounded-[14px] shadow-premium p-2 max-h-[280px] overflow-auto">
                  {addable.length === 0 && <div className="px-2 py-2 text-[11px] text-muted">All funds added</div>}
                  {addable.map((f) => (
                    <button key={f.schemeCode} onClick={() => { setPicked([...picked, f.schemeCode]); setAddOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface text-[12px] truncate text-body">
                      {shortName(f.name)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      {series.length > 0 && chartData.length > 1 ? (
        <div className="px-2 pt-6 pb-2" style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 32, bottom: 8, left: 8 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid
                strokeDasharray="4 6"
                stroke="#E5EDF5"
                vertical={false}
              />

              <XAxis
                dataKey="idx"
                tick={false}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={<YTick />}
                axisLine={false}
                tickLine={false}
                width={52}
                tickCount={6}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#0B1F3A", strokeWidth: 1, strokeDasharray: "4 4" }}
              />

              {view !== "Volatility" && (
                <ReferenceLine y={0} stroke="#B8C7D6" strokeWidth={1.5} />
              )}

              {series.map((s) => (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.5}
                  fill={`url(#grad-${s.id})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2.5, stroke: "#fff", fill: s.color }}
                  connectNulls={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 text-[13px] text-muted">
          Insufficient history for the selected funds and period.
        </div>
      )}

      {/* ── Legend + source ──────────────────────────────────────────────── */}
      {series.length > 0 && (
        <div className="px-6 pb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="inline-block w-6 h-[2.5px] rounded-full" style={{ background: s.color }} />
                <span className="text-[12px] text-body">{s.name}</span>
              </div>
            ))}
            <SaveCompareBtn picked={picked} period={period} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{viewLabel} · AMFI NAV data</p>
        </div>
      )}
    </div>
  );
}

function SaveCompareBtn({ picked, period }: { picked: string[]; period: string }) {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  if (!session?.user || picked.length === 0) return null;

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/user/compares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), schemeCodes: picked, period }),
    });
    setSaving(false); setSaved(true); setOpen(false); setName("");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[12px] text-muted hover:text-primary transition-colors">
        {saved ? <Check className="size-3.5 text-gain" /> : <Bookmark className="size-3.5" />}
        {saved ? "Saved!" : "Save comparison"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-20 bg-white border border-rule rounded-[12px] shadow-premium p-3 w-64">
            <p className="text-[12px] font-semibold text-heading mb-2">Save this comparison</p>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Top Hybrid Funds"
              className="w-full h-9 px-3 rounded-[8px] border border-rule text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-2"
              onKeyDown={(e) => e.key === "Enter" && save()} autoFocus />
            <button onClick={save} disabled={saving || !name.trim()}
              className="w-full h-9 rounded-[8px] bg-primary text-white text-[12.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="size-3.5 animate-spin" />} Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle<T extends string>({ active, options, onChange }: { active: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex items-center bg-surface border border-rule rounded-full p-0.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`h-7 px-3 text-[11px] font-semibold rounded-full transition-all whitespace-nowrap ${
            active === o ? "bg-primary text-white shadow-btn" : "text-muted hover:text-body"
          }`}>
          {o}
        </button>
      ))}
    </div>
  );
}
