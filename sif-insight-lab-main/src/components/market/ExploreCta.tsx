import { Link } from "@tanstack/react-router";
import { ArrowRight, Filter, Download, BarChart3 } from "lucide-react";
import { DERIVED } from "@/lib/market-derive";

export function ExploreCta() {
  const count = DERIVED.length;
  return (
    <section>
      <div className="max-w-[1440px] mx-auto px-6 py-14">
        <Link
          to="/explore"
          className="group relative block overflow-hidden rounded-2xl border border-border-strong bg-gradient-to-br from-primary/15 via-surface to-gold/10 p-8 lg:p-10 hover:border-primary/60 transition-all"
        >
          {/* decorative orbs */}
          <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 size-72 rounded-full bg-gold/10 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-10">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Full Screener
              </div>
              <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">
                Explore all <span className="text-primary tabular">{count}</span> SIFs in one place
              </h3>
              <p className="mt-2 text-[13px] lg:text-[14px] text-muted-foreground max-w-xl">
                Filter by strategy, AMC, risk and AUM. Switch between dense list and rich card views.
                Sort by any column. Export to CSV.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {[
                  { icon: Filter, label: "20+ filters" },
                  { icon: BarChart3, label: "Live sort" },
                  { icon: Download, label: "CSV export" },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-border-strong bg-surface/70 text-[11px] text-muted-foreground"
                  >
                    <b.icon className="size-3" />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <div className="inline-flex items-center gap-3 h-12 pl-5 pr-3 rounded-full bg-primary text-primary-foreground font-medium text-[14px] shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:gap-4 transition-all">
                Open Explorer
                <span className="size-9 rounded-full bg-primary-foreground/15 inline-flex items-center justify-center">
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
