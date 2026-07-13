import type { SnapshotStats } from "@/lib/sifData";

function StatCard({ value, label, sub, footnote }: { value: string; label: string; sub?: React.ReactNode; footnote?: string }) {
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
          fontFamily: "var(--font-dm-sans), sans-serif",
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
          fontFamily: "var(--font-dm-sans), sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {sub}
      {footnote && (
        <span
          style={{
            color: "#8FB5C4",
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          {footnote}
        </span>
      )}
    </div>
  );
}

function formatCrores(raw: number | null): string {
  if (raw == null) return "—";
  return `₹${(raw / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

function lastMonthLabel(isoDate: string): string {
  if (isoDate === "—") return "last month";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function MarketSnapshot({ stats }: { stats: SnapshotStats }) {
  const { equity, hybrid, debt } = stats.categoryBreakdown;

  const schemesBreakdown = (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
      {[
        { label: "Equity", value: equity },
        { label: "Hybrid", value: hybrid },
        { label: "Debt", value: debt },
      ].map((row) => (
        <span
          key={row.label}
          className="nums"
          style={{
            color: "#8FB5C4",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          {row.value} {row.label}
        </span>
      ))}
    </div>
  );

  const cards = [
    {
      label: "Total AUM",
      value: formatCrores(stats.totalAUM),
      footnote: `${stats.aumAsOfLabel ?? lastMonthLabel(stats.latestNavDate)} · Source: AMFI monthly release`,
    },
    { label: "AMCs Registered", value: String(stats.uniqueAMCs) },
    { label: "Regular Plans", value: String(stats.totalGrowthRegular) },
    { label: "Schemes", value: String(stats.totalGrowthRegular), sub: schemesBreakdown },
    { label: "NFOs In Pipeline", value: String(stats.nfosInPipeline) },
  ];


  return (
    <section
      style={{
        background: "#004C61",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
      className="market-snapshot-section px-6 py-14 sm:px-10 lg:px-[112px]"
    >
      <h2
        style={{
          color: "#fff",
          textAlign: "center",
          fontFamily: "var(--font-dm-sans), sans-serif",
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
