import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Zap, Plus, Check } from "lucide-react";
import { FUNDS, type Fund } from "@/lib/data";
import { Sparkline } from "@/components/ui-bits/Sparkline";
import { useCompareTray } from "./CompareTray";

const ASSET: Record<string, "Hybrid" | "Equity" | "Debt"> = {
  "Long-Short": "Equity",
  "Market Neutral": "Equity",
  "Quant": "Equity",
  "Event Driven": "Equity",
  "Multi-Asset": "Hybrid",
  "Hybrid Long-Short": "Hybrid",
  "Arbitrage": "Debt",
  "Credit Opportunities": "Debt",
};
const classOf = (f: Fund) => ASSET[f.category] || ASSET[f.strategy] || "Equity";

// Last 7 months ending May '26
const MONTHS = ["Nov '25", "Dec '25", "Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26"];

// Deterministic monthly returns per fund — derived from spark slope + a stable per-fund hash.
function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function monthlyReturns(f: Fund): (number | null)[] {
  const seed = hash(f.id);
  const launchYear = parseInt(f.launch.slice(-4));
  const launchMonth = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    .indexOf(f.launch.slice(3, 6));
  // months map to absolute index from Jan '25 = 0
  const monthAbs = [10, 11, 12, 13, 14, 15, 16]; // Nov'25..May'26 → years 2025/26
  const launchAbs = (launchYear - 2025) * 12 + launchMonth;
  const drift = f.returns.y1 / 12;
  return monthAbs.map((m, idx) => {
    if (m < launchAbs) return null;
    const r = ((Math.sin((seed + idx * 97) * 0.013) + Math.cos((seed + idx * 53) * 0.021)) * 3.2) + drift * 0.6;
    return +r.toFixed(2);
  });
}

function bgFor(r: number | null): string {
  if (r === null) return "transparent";
  const t = Math.min(Math.abs(r) / 8, 1);
  if (r >= 0) return `color-mix(in oklab, var(--color-positive) ${15 + t * 65}%, transparent)`;
  return `color-mix(in oklab, var(--color-negative) ${15 + t * 65}%, transparent)`;
}

export function PulseStrip() {
  const rows = useMemo(() => {
    return FUNDS.map((f) => ({ f, klass: classOf(f), months: monthlyReturns(f) }));
  }, []);

  // group by asset class
  const grouped = useMemo(() => {
    const g: Record<string, typeof rows> = { Hybrid: [], Equity: [], Debt: [] };
    for (const r of rows) g[r.klass].push(r);
    return g;
  }, [rows]);

  // Aggregates for last month (May '26 → idx 6)
  const lastIdx = 6;
  const lastVals = rows.map((r) => r.months[lastIdx]).filter((x): x is number => x !== null);
  const best = Math.max(...lastVals);
  const worst = Math.min(...lastVals);
  const avg = lastVals.reduce((s, x) => s + x, 0) / lastVals.length;

  return (
    <section className="border-b border-border bg-surface/40">
      <div className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Monthly Returns Heatmap</div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">Every SIF, one glance.</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Last 7 months · {Object.keys(grouped).filter((k) => grouped[k].length).length} categories · {rows.length} funds
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <Stat dot="positive" label={`Best ${MONTHS[lastIdx]}`} value={`+${best.toFixed(2)}%`} />
            <Stat dot="negative" label={`Worst ${MONTHS[lastIdx]}`} value={`${worst.toFixed(2)}%`} />
            <Stat dot="gold" label={`Avg ${MONTHS[lastIdx]}`} value={`${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%`} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Heatmap table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-surface-2/60">
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sticky left-0 bg-surface-2/60 z-10">Fund</th>
                    {MONTHS.map((m, i) => (
                      <th key={m} className={`px-2 py-2.5 text-center font-mono text-[10px] uppercase tracking-widest ${i === lastIdx ? "text-primary" : "text-muted-foreground"}`}>
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["Hybrid", "Equity", "Debt"] as const).map((k) =>
                    grouped[k].length ? (
                      <FragmentGroup key={k} label={k} rows={grouped[k]} lastIdx={lastIdx} />
                    ) : null,
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Color intensity = magnitude of monthly return</span>
              <div className="flex items-center gap-1">
                <span>Loss</span>
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-negative) 80%, transparent)" }} />
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-negative) 35%, transparent)" }} />
                <span className="inline-block w-4 h-2.5 rounded-sm bg-surface-2 border border-border" />
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-positive) 35%, transparent)" }} />
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-positive) 80%, transparent)" }} />
                <span>Gain</span>
              </div>
            </div>
          </div>

          {/* Leaders & Laggards merged sidebar */}
          <LeadersSide />
        </div>
      </div>
    </section>
  );
}

function Stat({ dot, label, value }: { dot: "positive" | "negative" | "gold"; label: string; value: string }) {
  const color = dot === "positive" ? "var(--color-positive)" : dot === "negative" ? "var(--color-negative)" : "var(--color-gold)";
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="tabular text-foreground">{value}</span>
    </span>
  );
}

function LeadersSide() {
  const { top, bottom, movers } = useMemo(() => {
    const sorted = [...FUNDS].sort((a, b) => b.returns.m1 - a.returns.m1);
    return {
      top: sorted.slice(0, 3),
      bottom: sorted.slice(-3).reverse(),
      movers: [...FUNDS]
        .map((f) => ({ f, delta: f.returns.m1 - f.returns.m3 / 3 }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 3),
    };
  }, []);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary">This Month</div>
        <h3 className="mt-0.5 text-[13px] font-semibold">Who won. Who lost. Who moved.</h3>
      </div>
      <Group icon={TrendingUp} label="Top 3" tone="positive" funds={top.map((f) => ({ f, val: f.returns.m1 }))} />
      <Group icon={TrendingDown} label="Bottom 3" tone="negative" funds={bottom.map((f) => ({ f, val: f.returns.m1 }))} />
      <Group icon={Zap} label="Biggest movers" tone="gold" funds={movers.map((m) => ({ f: m.f, val: m.delta }))} />
    </div>
  );
}

function FragmentGroup({ label, rows, lastIdx }: { label: string; rows: { f: Fund; months: (number | null)[] }[]; lastIdx: number }) {
  void lastIdx;
  return (
    <>
      <tr>
        <td colSpan={8} className="px-4 pt-3 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-foreground/80 border-t border-border first:border-t-0">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" /> {label}
          </span>
        </td>
      </tr>
      {rows.map(({ f, months }) => (
        <tr key={f.id} className="hover:bg-surface-2/40 transition-colors">
          <td className="px-4 py-2 sticky left-0 bg-surface z-10">
            <Link to="/fund/$id" params={{ id: f.id }} className="block hover:text-primary">
              <div className="text-[12px] font-medium leading-tight truncate max-w-[200px]">
                {f.name.split(" ").slice(0, 2).join(" ")}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                {f.name.replace(/\s*Fund\s*$/, "").split(" ").slice(2).join(" ") || f.category}
              </div>
            </Link>
          </td>
          {months.map((r, i) => (
            <td key={i} className="p-1">
              <div
                className="h-9 rounded flex items-center justify-center text-[11px] font-mono tabular border border-border/40"
                style={{ backgroundColor: bgFor(r), borderColor: r === null ? "var(--color-border)" : undefined }}
                title={r === null ? "Pre-launch" : `${f.name}: ${r >= 0 ? "+" : ""}${r.toFixed(2)}%`}
              >
                {r === null ? <span className="text-muted-foreground/40">—</span> : (
                  <span>{r >= 0 ? "+" : ""}{r.toFixed(2)}%</span>
                )}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Group({
  icon: Icon, label, tone, funds,
}: {
  icon: typeof TrendingUp;
  label: string;
  tone: "positive" | "negative" | "gold";
  funds: { f: Fund; val: number }[];
}) {
  const color = `var(--color-${tone})`;
  return (
    <div className="px-4 py-2.5 border-b border-border last:border-0 flex-1">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="size-3" style={{ color }} />
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <ul className="space-y-0.5">
        {funds.map(({ f, val }) => (
          <Row key={f.id + label} f={f} val={val} tone={tone} />
        ))}
      </ul>
    </div>
  );
}

function Row({ f, val, tone }: { f: Fund; val: number; tone: "positive" | "negative" | "gold" }) {
  const { toggle, has } = useCompareTray();
  const inTray = has(f.id);
  const valueColor = tone === "gold"
    ? (val >= 0 ? "text-positive" : "text-negative")
    : tone === "positive" ? "text-positive" : "text-negative";
  return (
    <li className="group flex items-center gap-2 py-1 px-1 rounded-md hover:bg-surface-2 transition-colors">
      <Link to="/fund/$id" params={{ id: f.id }} className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium truncate">{f.name.replace(/\s*Fund\s*$/, "").split(" ").slice(0, 2).join(" ")}</div>
        </div>
        <div className="w-10 h-4 shrink-0 opacity-70">
          <Sparkline data={f.spark} stroke={val >= 0 ? "var(--color-positive)" : "var(--color-negative)"} />
        </div>
        <div className={`tabular text-[11px] font-semibold w-12 text-right ${valueColor}`}>
          {val >= 0 ? "+" : ""}{val.toFixed(2)}%
        </div>
      </Link>
      <button
        onClick={() => toggle(f.id)}
        title={inTray ? "Remove" : "Add to compare"}
        className={`size-5 inline-flex items-center justify-center rounded border transition ${
          inTray ? "bg-primary text-primary-foreground border-primary" : "border-border-strong text-muted-foreground hover:text-foreground"
        }`}
      >
        {inTray ? <Check className="size-2.5" /> : <Plus className="size-2.5" />}
      </button>
    </li>
  );
}
