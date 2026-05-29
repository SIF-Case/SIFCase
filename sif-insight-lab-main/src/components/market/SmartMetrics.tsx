import { smartMetrics, fmtCr, type Timeframe } from "@/lib/market-derive";

export function SmartMetrics({ tf }: { tf: Timeframe }) {
  const m = smartMetrics(tf);
  const cells = [
    { label: "Total SIF AUM", value: fmtCr(m.totalAUM), delta: "+2.4%" },
    { label: `Net ${tf} Inflows`, value: fmtCr(m.netFlow), delta: m.netFlow >= 0 ? "↑" : "↓", tone: m.netFlow >= 0 ? "pos" : "neg" },
    { label: "Active SIFs", value: String(m.activeSIFs), delta: `+${m.newLaunches} new` },
    { label: "Highest Flow", value: m.topStrategy, delta: "leader" },
    { label: "Avg Sharpe", value: m.avgSharpe.toFixed(2), delta: "risk-adj" },
    { label: "Avg Cash", value: `${m.avgCash.toFixed(0)}%`, delta: m.avgCash > 20 ? "elevated" : "normal" },
    { label: "Hedge Activity", value: m.hedgeLevel, delta: "derivatives" },
    { label: "New Launches (30d)", value: String(m.newLaunches), delta: "pipeline" },
  ] as const;

  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {cells.map((c) => (
            <div key={c.label} className="bg-surface p-4 hover:bg-surface-2 transition-colors">
              <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{c.label}</div>
              <div className="mt-1.5 text-[18px] font-semibold tabular leading-tight">{c.value}</div>
              <div
                className={`mt-1 text-[10px] tabular ${
                  "tone" in c && c.tone === "pos"
                    ? "text-positive"
                    : "tone" in c && c.tone === "neg"
                    ? "text-negative"
                    : "text-muted-foreground"
                }`}
              >
                {c.delta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
