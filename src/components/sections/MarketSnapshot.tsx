import type { SnapshotStats } from "@/lib/sifData";

export function MarketSnapshot({ stats }: { stats: SnapshotStats }) {
  const cards = [
    { label: "Total SIFs", value: String(stats.totalSchemes), sub: "schemes in database" },
    { label: "AMCs with SIFs", value: String(stats.uniqueAMCs), sub: "active asset managers" },
    { label: "Regular Plan SIFs", value: String(stats.totalRegular), sub: "advisor-eligible plans" },
    { label: "Latest NAV Date", value: stats.latestNavDate.slice(5).replace("-", " "), sub: stats.latestNavDate.slice(0, 4) + " · Regular Plans" },
    { label: "NAV Records", value: stats.totalNavRecords.toLocaleString("en-IN"), sub: "stored in database" },
    { label: "Direct Plan SIFs", value: String(stats.totalSchemes - stats.totalRegular), sub: "direct investor plans" },
  ];

  return (
    <section className="bg-surface py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Market Snapshot</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">
              SIF universe at a glance
            </h2>
            <p className="text-[15px] text-muted">
              Live data from AMFI — last updated {stats.latestNavDate}
            </p>
          </div>
          <span className="text-[12px] text-faint bg-[#F1F5F9] rounded-full px-3 py-1">
            Sourced from AMFI
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium"
            >
              <p className="text-[12px] font-medium text-muted mb-3">{stat.label}</p>
              <p className="text-[26px] font-bold text-heading nums leading-none mb-2">{stat.value}</p>
              <p className="text-[11px] text-faint">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
