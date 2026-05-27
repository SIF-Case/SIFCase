import { SourceBadge } from "@/components/ui/SourceBadge";
import { SNAPSHOT_STATS } from "@/lib/staticData";

export function MarketSnapshot() {
  return (
    <section className="bg-surface py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              SIF Market Snapshot
            </h2>
            <p className="text-[15px] text-muted">
              Overview of the SIF universe as of 25 May 2026
            </p>
          </div>
          <span className="text-[12px] text-faint bg-[#F1F5F9] rounded-full px-3 py-1">
            Sample data — not live
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SNAPSHOT_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium"
            >
              <p className="text-[12px] font-medium text-muted mb-3">
                {stat.label}
              </p>
              <p className="text-[26px] font-bold text-heading nums leading-none mb-2">
                {stat.value}
              </p>
              <p className="text-[11px] text-faint mb-3">{stat.sub}</p>
              <SourceBadge variant={stat.badge} className="text-[9.5px]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
