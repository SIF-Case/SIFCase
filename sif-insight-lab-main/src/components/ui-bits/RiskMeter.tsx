export function RiskMeter({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const colors = [
    "var(--color-positive)",
    "var(--color-positive)",
    "var(--color-gold)",
    "var(--color-gold)",
    "var(--color-negative)",
  ];
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-5 h-1.5 rounded-sm"
          style={{
            backgroundColor: i <= level ? colors[i - 1] : "var(--color-border-strong)",
            opacity: i <= level ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}
