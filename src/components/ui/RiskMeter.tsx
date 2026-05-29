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

export function RiskGauge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const segs = [
    { color: "var(--color-positive)" },
    { color: "#a3d977" },
    { color: "var(--color-gold)" },
    { color: "#f0915a" },
    { color: "var(--color-negative)" },
  ];
  const cx = 50, cy = 50, r = 40;
  const segAngle = 180 / 5;
  const needleDeg = -180 + segAngle * (level - 0.5);
  const rad = (needleDeg * Math.PI) / 180;
  const nx = cx + (r - 6) * Math.cos(rad);
  const ny = cy + (r - 6) * Math.sin(rad);

  const arc = (i: number) => {
    const a1 = (-180 + i * segAngle) * Math.PI / 180;
    const a2 = (-180 + (i + 1) * segAngle) * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="w-[110px]">
      <svg viewBox="0 0 100 60" className="w-full h-auto">
        {segs.map((s, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={s.color} strokeWidth="9" strokeLinecap="butt" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--color-foreground)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3" fill="var(--color-foreground)" />
      </svg>
      <div className="text-center text-[9px] font-mono uppercase tracking-widest text-muted -mt-1">
        {["Low", "Low-Mod", "Moderate", "Mod-High", "High"][level - 1]} risk
      </div>
    </div>
  );
}
