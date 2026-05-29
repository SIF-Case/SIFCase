import { useMemo, useState } from "react";
import { strategyFlows, amcFlows, colorFor, colorForAmc, fmtCr, type Timeframe } from "@/lib/market-derive";

type Mode = "strategy" | "amc";

// Renders an SVG donut from segments with share %
function Donut({ segments, label }: { segments: { label: string; share: number; color: string }[]; label: string }) {
  const size = 200;
  const r = 78;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const total = segments.reduce((s, x) => s + x.share, 0) || 1;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px]">
      {segments.map((s, i) => {
        const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
        acc += s.share;
        const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={s.color}
            opacity={0.92}
            stroke="var(--color-background)"
            strokeWidth={1.5}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={46} fill="var(--color-background)" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9, letterSpacing: 1.5 }}>
        {label}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
        {segments.length} buckets
      </text>
    </svg>
  );
}

export function CapitalFlowsMap({ tf }: { tf: Timeframe }) {
  const [mode, setMode] = useState<Mode>("strategy");

  const rows = useMemo(() => {
    if (mode === "strategy") {
      return strategyFlows(tf).map((r) => ({
        key: r.strategy,
        label: r.strategy,
        aum: r.aum,
        aumShare: r.aumShare,
        flow: r.flow,
        count: r.count,
        color: colorFor(r.strategy),
      }));
    }
    return amcFlows(tf).map((r, i) => ({
      key: r.amc,
      label: r.amc,
      aum: r.aum,
      aumShare: r.aumShare,
      flow: r.flow,
      count: r.count,
      color: colorForAmc(r.amc, i),
    }));
  }, [mode, tf]);

  const totalAum = rows.reduce((s, r) => s + r.aum, 0);
  const totalFlow = rows.reduce((s, r) => s + r.flow, 0);

  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Capital Flows Map</div>
            <h2 className="mt-1.5 text-xl lg:text-2xl font-semibold tracking-tight">
              {mode === "strategy" ? "AUM & flow by SIF category" : "AUM & flow by AMC"} — {tf}
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {fmtCr(totalAum)} AUM · {totalFlow >= 0 ? "+" : ""}{fmtCr(totalFlow)} net {tf} flow
            </p>
          </div>

          <div className="inline-flex p-0.5 rounded-md border border-border-strong bg-surface">
            {[
              { k: "strategy" as Mode, l: "By Strategy" },
              { k: "amc" as Mode, l: "By AMC" },
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => setMode(o.k)}
                className={`h-7 px-3 rounded text-[11px] font-medium transition ${
                  mode === o.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 grid lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Donut + legend stats */}
          <div className="flex flex-col items-center">
            <Donut
              segments={rows.map((r) => ({ label: r.label, share: r.aumShare, color: r.color }))}
              label={mode === "strategy" ? "STRATEGIES" : "AMCS"}
            />
            <div className="mt-3 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total AUM</div>
              <div className="text-[15px] font-semibold tabular">{fmtCr(totalAum)}</div>
            </div>
          </div>

          {/* Ranked list */}
          <div className="divide-y divide-border">
            <div className="hidden md:grid grid-cols-[1fr_70px_90px_90px_60px] gap-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>{mode === "strategy" ? "Strategy" : "AMC"}</span>
              <span className="text-right">Share</span>
              <span className="text-right">AUM</span>
              <span className="text-right">Net Flow</span>
              <span className="text-right">Funds</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[1fr_70px_90px_90px_60px] gap-3 py-2.5 items-center text-[12px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="font-medium truncate">{r.label}</span>
                </div>
                <div className="text-right tabular text-muted-foreground">{r.aumShare.toFixed(1)}%</div>
                <div className="text-right tabular">{fmtCr(r.aum)}</div>
                <div className={`text-right tabular font-medium ${r.flow >= 0 ? "text-positive" : "text-negative"}`}>
                  {r.flow >= 0 ? "+" : ""}{fmtCr(r.flow)}
                </div>
                <div className="text-right tabular text-muted-foreground">{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
