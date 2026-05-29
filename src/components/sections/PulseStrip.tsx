'use client';

import { useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Zap, Plus, Check } from "lucide-react";
import type { MonthlyHeatmapFund } from "@/lib/sifData";
import type { FundRow } from "@/lib/sifData";
import { Sparkline } from "@/components/ui/Sparkline";
import { useCompareTray } from "@/components/ui/CompareTray";

function bgFor(r: number | null): string {
  if (r === null) return "transparent";
  const t = Math.min(Math.abs(r) / 8, 1);
  if (r >= 0) return `color-mix(in oklab, var(--color-positive) ${15 + t * 65}%, transparent)`;
  return `color-mix(in oklab, var(--color-negative) ${15 + t * 65}%, transparent)`;
}

type Props = {
  funds: MonthlyHeatmapFund[];
  monthLabels: string[];
  topFunds: FundRow[];
};

export function PulseStrip({ funds, monthLabels, topFunds }: Props) {
  const grouped = useMemo(() => {
    const g: Record<string, MonthlyHeatmapFund[]> = { Equity: [], Hybrid: [] };
    for (const f of funds) g[f.category]?.push(f);
    return g;
  }, [funds]);

  const lastIdx = monthLabels.length - 1;
  const lastVals = funds.map((f) => f.months[lastIdx]).filter((x): x is number => x !== null);
  const best = lastVals.length ? Math.max(...lastVals) : null;
  const worst = lastVals.length ? Math.min(...lastVals) : null;
  const avg = lastVals.length ? lastVals.reduce((s, x) => s + x, 0) / lastVals.length : null;

  if (funds.length === 0) return null;

  return (
    <section className="border-b border-rule bg-surface">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-section">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Monthly Returns Heatmap</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">Every SIF, one glance.</h2>
            <p className="text-[15px] text-muted">
              Last {monthLabels.length} months · {Object.values(grouped).filter((g) => g.length).length} categories · {funds.length} funds
            </p>
          </div>
          {lastVals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              {best !== null && <Stat dot="positive" label={`Best ${monthLabels[lastIdx]}`} value={`+${best.toFixed(2)}%`} />}
              {worst !== null && <Stat dot="negative" label={`Worst ${monthLabels[lastIdx]}`} value={`${worst.toFixed(2)}%`} />}
              {avg !== null && <Stat dot="gold" label={`Avg ${monthLabels[lastIdx]}`} value={`${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%`} />}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="bg-white border border-rule rounded-[18px] overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-mist">
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted sticky left-0 bg-mist z-10">Fund</th>
                    {monthLabels.map((m, i) => (
                      <th key={m} className={`px-2 py-2.5 text-center font-mono text-[10px] uppercase tracking-widest ${i === lastIdx ? "text-primary" : "text-muted"}`}>
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["Equity", "Hybrid"] as const).map((k) =>
                    grouped[k]?.length ? (
                      <GroupRows key={k} label={k} rows={grouped[k]} lastIdx={lastIdx} />
                    ) : null,
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-rule flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted">
              <span>Source: AMFI NAV data · Returns calculated by SIFcase</span>
              <div className="flex items-center gap-1">
                <span>Loss</span>
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-negative) 80%, transparent)" }} />
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-negative) 35%, transparent)" }} />
                <span className="inline-block w-4 h-2.5 rounded-sm bg-surface border border-rule" />
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-positive) 35%, transparent)" }} />
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: "color-mix(in oklab, var(--color-positive) 80%, transparent)" }} />
                <span>Gain</span>
              </div>
            </div>
          </div>

          <LeadersSide topFunds={topFunds} />
        </div>
      </div>
    </section>
  );
}

function Stat({ dot, label, value }: { dot: "positive" | "negative" | "gold"; label: string; value: string }) {
  const color = dot === "positive" ? "var(--color-gain)" : dot === "negative" ? "var(--color-loss)" : "var(--color-caution)";
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rule bg-white">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      <span className="uppercase tracking-widest text-muted">{label}</span>
      <span className="tabular text-body">{value}</span>
    </span>
  );
}

function GroupRows({ label, rows, lastIdx }: { label: string; rows: MonthlyHeatmapFund[]; lastIdx: number }) {
  void lastIdx;
  return (
    <>
      <tr>
        <td colSpan={20} className="px-4 pt-3 pb-1.5 font-mono text-[10px] uppercase tracking-widest text-body border-t border-rule first:border-t-0">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" /> {label}
          </span>
        </td>
      </tr>
      {rows.map((f) => (
        <tr key={f.schemeCode} className="hover:bg-surface transition-colors">
          <td className="px-4 py-2 sticky left-0 bg-white z-10">
            <Link href={`/sifs/${f.schemeCode.toLowerCase()}`} className="block hover:text-primary">
              <div className="text-[12px] font-medium leading-tight truncate max-w-[200px]">
                {f.name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim().split(" ").slice(0, 3).join(" ")}
              </div>
              <div className="text-[10px] font-mono text-muted truncate max-w-[200px]">{f.strategy}</div>
            </Link>
          </td>
          {f.months.map((r, i) => (
            <td key={i} className="p-1">
              <div
                className="h-9 rounded flex items-center justify-center text-[11px] font-mono tabular border border-rule/40"
                style={{ backgroundColor: bgFor(r) }}
                title={r === null ? "No data" : `${r >= 0 ? "+" : ""}${r.toFixed(2)}%`}
              >
                {r === null ? (
                  <span className="text-muted/40">—</span>
                ) : (
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

function LeadersSide({ topFunds }: { topFunds: FundRow[] }) {
  const { top, bottom, movers } = useMemo(() => {
    const withSI = topFunds.filter((f) => f.returns["SI"] !== null);
    const sorted = [...withSI].sort((a, b) => (b.returns["SI"] ?? 0) - (a.returns["SI"] ?? 0));
    return {
      top: sorted.slice(0, 3),
      bottom: sorted.slice(-3).reverse(),
      movers: [...withSI]
        .map((f) => ({ f, delta: (f.returns["SI"] ?? 0) - (f.returns["1M"] ?? 0) }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 3),
    };
  }, [topFunds]);

  if (topFunds.length === 0) return null;

  return (
    <div className="bg-white border border-rule rounded-[18px] overflow-hidden flex flex-col shadow-card">
      <div className="px-5 py-4 border-b border-rule">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-0.5">Since Inception</div>
        <h3 className="text-[15px] font-bold text-heading">Who leads. Who lags. Who moved.</h3>
      </div>
      <LeaderGroup icon={TrendingUp} label="Top 3" tone="positive" items={top.map((f) => ({ f, val: f.returns["SI"] ?? 0 }))} />
      <LeaderGroup icon={TrendingDown} label="Bottom 3" tone="negative" items={bottom.map((f) => ({ f, val: f.returns["SI"] ?? 0 }))} />
      <LeaderGroup icon={Zap} label="Biggest movers" tone="gold" items={movers.map((m) => ({ f: m.f, val: m.delta }))} />
    </div>
  );
}

function LeaderGroup({
  icon: Icon, label, tone, items,
}: {
  icon: typeof TrendingUp;
  label: string;
  tone: "positive" | "negative" | "gold";
  items: { f: FundRow; val: number }[];
}) {
  const color = tone === "positive" ? "var(--color-gain)" : tone === "negative" ? "var(--color-loss)" : "var(--color-caution)";
  return (
    <div className="px-5 py-3 border-b border-rule last:border-0 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-3.5" style={{ color }} />
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map(({ f, val }) => (
          <LeaderRow key={f.schemeCode + label} f={f} val={val} tone={tone} />
        ))}
      </ul>
    </div>
  );
}

function LeaderRow({ f, val, tone }: { f: FundRow; val: number; tone: "positive" | "negative" | "gold" }) {
  const { toggle, has } = useCompareTray();
  const inTray = has(f.schemeCode);
  const valueColor = tone === "gold" ? (val >= 0 ? "text-gain" : "text-loss") : tone === "positive" ? "text-gain" : "text-loss";
  const spark = f.sparklines["SI"];
  return (
    <li className="group flex items-center gap-2.5 py-1.5 px-1 rounded-md hover:bg-surface transition-colors">
      <Link href={`/sifs/${f.schemeCode.toLowerCase()}`} className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium truncate text-body">
            {f.name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim().split(" ").slice(0, 3).join(" ")}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted truncate">{f.amc}</div>
        </div>
        {spark.length > 1 && (
          <div className="w-12 h-5 shrink-0 opacity-70">
            <Sparkline data={spark} stroke={val >= 0 ? "var(--color-gain)" : "var(--color-loss)"} />
          </div>
        )}
        <div className={`tabular text-[12px] font-semibold w-14 text-right ${valueColor}`}>
          {val >= 0 ? "+" : ""}{val.toFixed(2)}%
        </div>
      </Link>
      <button
        onClick={() => toggle(f.schemeCode)}
        title={inTray ? "Remove from compare" : "Add to compare"}
        className={`size-6 inline-flex items-center justify-center rounded-md border transition ${
          inTray ? "bg-primary text-white border-primary" : "border-rule-strong text-muted hover:text-body hover:bg-surface"
        }`}
      >
        {inTray ? <Check className="size-3" /> : <Plus className="size-3" />}
      </button>
    </li>
  );
}
