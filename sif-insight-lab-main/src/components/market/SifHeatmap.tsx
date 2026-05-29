import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DERIVED, returnOf, flowOf, colorFor, fmtCr, type Timeframe, type FundDerived } from "@/lib/market-derive";

type Metric = "return" | "sharpe" | "drawdown" | "flow";
const METRICS: { key: Metric; label: string }[] = [
  { key: "return", label: "Return" },
  { key: "sharpe", label: "Sharpe" },
  { key: "drawdown", label: "Drawdown" },
  { key: "flow", label: "Net Flow" },
];

function valueOf(f: FundDerived, m: Metric, tf: Timeframe) {
  if (m === "return") return returnOf(f, tf);
  if (m === "sharpe") return f.metrics.sharpe;
  if (m === "drawdown") return f.metrics.drawdown;
  return flowOf(f, tf);
}

function colorScale(v: number, min: number, max: number) {
  // map v in [min,max] to red→neutral→green
  const mid = (min + max) / 2;
  if (v >= mid) {
    const t = max === mid ? 1 : (v - mid) / (max - mid);
    return `color-mix(in oklab, var(--color-positive) ${Math.round(20 + t * 70)}%, transparent)`;
  }
  const t = mid === min ? 1 : (mid - v) / (mid - min);
  return `color-mix(in oklab, var(--color-negative) ${Math.round(20 + t * 70)}%, transparent)`;
}

export function SifHeatmap({ tf }: { tf: Timeframe }) {
  const [metric, setMetric] = useState<Metric>("return");
  const [hover, setHover] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, FundDerived[]>();
    for (const f of DERIVED) {
      const arr = map.get(f.strategy) ?? [];
      arr.push(f);
      map.set(f.strategy, arr);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const aum = (xs: FundDerived[]) => xs.reduce((s, f) => s + f.aum, 0);
      return aum(b[1]) - aum(a[1]);
    });
  }, []);

  const all = DERIVED.map((f) => valueOf(f, metric, tf));
  const min = Math.min(...all);
  const max = Math.max(...all);

  const fmt = (v: number) =>
    metric === "flow" ? fmtCr(v) : metric === "sharpe" ? v.toFixed(2) : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  const hovered = hover ? DERIVED.find((f) => f.id === hover) : null;

  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">SIF Heatmap</div>
            <h2 className="mt-1.5 text-xl lg:text-2xl font-semibold tracking-tight">
              Every SIF, color-coded by {METRICS.find((m) => m.key === metric)?.label.toLowerCase()}
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Tile size ∝ AUM · grouped by strategy · click to drill into fund page.
            </p>
          </div>
          <div className="inline-flex p-0.5 rounded-md border border-border-strong bg-surface">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`h-7 px-3 rounded text-[11px] font-medium transition ${
                  metric === m.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 relative">
          <div className="space-y-3">
            {groups.map(([strategy, funds]) => {
              const groupAUM = funds.reduce((s, f) => s + f.aum, 0);
              return (
                <div key={strategy}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="size-2 rounded-full" style={{ background: colorFor(strategy) }} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground">{strategy}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {funds.length} · {fmtCr(groupAUM)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {funds.map((f) => {
                      const v = valueOf(f, metric, tf);
                      const w = Math.max(80, 80 + (f.aum / groupAUM) * 320);
                      return (
                        <Link
                          key={f.id}
                          to="/fund/$id"
                          params={{ id: f.id }}
                          onMouseEnter={() => setHover(f.id)}
                          onMouseLeave={() => setHover(null)}
                          style={{ width: w, background: colorScale(v, min, max) }}
                          className="block rounded-md border border-border-strong/60 p-2.5 h-20 hover:border-foreground/40 hover:scale-[1.02] transition-transform"
                        >
                          <div className="text-[10px] font-medium leading-tight line-clamp-2">
                            {f.name.replace(/\s*(SIF|Fund)\s*$/, "")}
                          </div>
                          <div className="mt-1 text-[13px] font-semibold tabular">{fmt(v)}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* hover detail */}
          {hovered && (
            <div className="absolute top-4 right-4 w-60 bg-surface-2 border border-border-strong rounded-lg p-3 shadow-2xl shadow-black/40 pointer-events-none">
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: colorFor(hovered.strategy) }}>
                {hovered.strategy}
              </div>
              <div className="mt-0.5 text-[12px] font-semibold leading-tight">{hovered.name}</div>
              <div className="text-[10px] text-muted-foreground">{hovered.amc}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <Cell label="AUM" value={fmtCr(hovered.aum)} />
                <Cell label={`Ret ${tf}`} value={`${returnOf(hovered, tf) >= 0 ? "+" : ""}${returnOf(hovered, tf).toFixed(1)}%`} />
                <Cell label="Sharpe" value={hovered.metrics.sharpe.toFixed(2)} />
                <Cell label="Drawdown" value={`${hovered.metrics.drawdown.toFixed(1)}%`} />
              </div>
            </div>
          )}

          {/* legend */}
          <div className="mt-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Weak</span>
            <div className="h-2 flex-1 max-w-xs rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--color-negative) 80%, transparent), color-mix(in oklab, var(--color-negative) 20%, transparent), color-mix(in oklab, var(--color-positive) 20%, transparent), color-mix(in oklab, var(--color-positive) 80%, transparent))" }} />
            <span>Strong</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="tabular font-medium">{value}</div>
    </div>
  );
}
