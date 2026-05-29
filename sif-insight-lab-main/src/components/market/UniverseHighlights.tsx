import { Sparkles, TrendingUp, Shield, Layers } from "lucide-react";
import { aiInsights, smartMetrics, strategyFlows, type Timeframe } from "@/lib/market-derive";

const ICONS = [TrendingUp, Shield, Layers];

export function UniverseHighlights({ tf }: { tf: Timeframe }) {
  const insights = aiInsights(tf);
  const sm = smartMetrics(tf);
  const top = strategyFlows(tf)[0];

  const labels = [
    `Flow Leader · ${top?.strategy ?? "—"}`,
    `Liquidity · avg ${sm.avgCash.toFixed(0)}% cash`,
    `Quality · Sharpe ${sm.avgSharpe.toFixed(2)}`,
  ];

  return (
    <section className="border-b border-border bg-gradient-to-b from-transparent to-surface/40">
      <div className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 text-primary inline-flex items-center justify-center border border-primary/20">
              <Sparkles className="size-4" />
            </span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Universe Highlights</div>
              <h2 className="mt-1 text-xl lg:text-2xl font-semibold tracking-tight">What stands out — {tf}</h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border-strong px-2.5 py-1 rounded-full">
            <span className="size-1.5 rounded-full bg-primary" />
            AI · generated
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {insights.map((text, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <article
                key={i}
                className="group relative overflow-hidden bg-surface border border-border rounded-xl p-5 hover:border-primary/40 transition-colors"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2">
                  <span className="size-7 rounded-md bg-surface-2 inline-flex items-center justify-center text-primary">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                    {labels[i]}
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-foreground/90">{text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
