import { Calendar } from "lucide-react";
import { TIMEFRAMES, type Timeframe } from "@/lib/market-derive";

export function UniverseHeader({ tf, onTf }: { tf: Timeframe; onTf: (t: Timeframe) => void }) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-surface/60 to-transparent">
      <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary">
              <span className="size-1.5 rounded-full bg-positive animate-pulse" />
              Live · SIFs Universe
            </div>
            <h1 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">
              The SIF ecosystem at a glance
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-2xl">
              Flows, allocations and dispersion across every Specialized Investment Fund — refreshed live, filterable by window.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border-strong bg-surface">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => onTf(t)}
                className={`h-7 px-3 rounded-full text-[11px] font-medium tabular transition ${
                  tf === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              aria-label="Custom range"
              className="h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Calendar className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
