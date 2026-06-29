import type { SnapshotStats } from "@/lib/sifData";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="stat-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minWidth: 150,
        padding: "20px 35px 16px",
        borderRadius: 16,
        background: "#fff",
        gap: 12,
      }}
    >
      <span
        className="nums"
        style={{
          color: "#000",
          fontSize: 20,
          fontWeight: 500,
          lineHeight: "16px",
          textTransform: "uppercase",
          fontFamily: "'Satoshi Variable', sans-serif",
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: "#3B8BB1",
          fontSize: 14,
          fontWeight: 500,
          lineHeight: "16px",
          textTransform: "capitalize",
          fontFamily: "'Satoshi Variable', sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function MarketSnapshot({ stats }: { stats: SnapshotStats }) {
  const cards = [
    { label: "SIFs Tracked", value: String(stats.totalSchemes) },
    { label: "AMCs Registered", value: String(stats.uniqueAMCs) },
    { label: "Regular Plans", value: String(stats.totalGrowthRegular) },
    { label: "Schemes", value: String(stats.totalRegular) },
    { label: "NAV Records", value: stats.totalNavRecords.toLocaleString("en-IN") },
  ];


  return (
    <section
      style={{
        background: "#004C61",
        padding: "56px 112px 56px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
      className="market-snapshot-section"
    >
      <h2
        style={{
          color: "#fff",
          textAlign: "center",
          fontFamily: "'Satoshi Variable', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          lineHeight: "30px",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        SIF Universe At A Glance
      </h2>

      <div
        className="stats-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 50,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {cards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
