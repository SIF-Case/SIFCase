export const RISK_COLORS = [
  "#22C55E",   // 1 Low
  "#84CC16",   // 2 Low to Moderate
  "#EAB308",   // 3 Moderate
  "#DC2626",   // 4 Moderately High
  "#7F1D1D",   // 5 High
];

export const RISK_LABELS = [
  "Low", "Low-Mod", "Moderate", "Mod-High", "High",
];

export function RiskMeter({ level: rawLevel, size = "md" }: { level: 1 | 2 | 3 | 4 | 5; size?: "md" | "sm" }) {
  const level = Math.max(1, Math.min(5, Math.round(Number(rawLevel)))) as 1 | 2 | 3 | 4 | 5;
  const segClass = size === "sm" ? "w-3 h-1 rounded-[1px]" : "w-5 h-1.5 rounded-sm";
  return (
    <div className={`flex ${size === "sm" ? "gap-0.5" : "gap-1"}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={segClass}
          style={{
            backgroundColor: i <= level ? RISK_COLORS[i - 1] : "#E2E8F0",
          }}
        />
      ))}
    </div>
  );
}

export function RiskGauge({ level: rawLevel }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const level = Math.max(1, Math.min(5, Math.round(Number(rawLevel)))) as 1 | 2 | 3 | 4 | 5;
  if (!level || isNaN(level)) return null;
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
        {RISK_COLORS.map((color, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="butt" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3" fill="#0B1F3A" />
      </svg>
      <div className="text-center text-[9px] font-mono uppercase tracking-widest text-muted -mt-1">
        {RISK_LABELS[level - 1]}
      </div>
    </div>
  );
}


export function SEBIRiskometer({
  level: rawLevel,
  title,
  subtitle,
  size = "md",
}: {
  level: 1 | 2 | 3 | 4 | 5;
  title?: string;
  subtitle?: string;
  size?: "md" | "sm";
}) {
  const level = Math.max(1, Math.min(5, Math.round(Number(rawLevel)))) as 1 | 2 | 3 | 4 | 5;
  if (!level || isNaN(level)) return null;

  if (size === "sm") {
    return (
      <div className="w-full">
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-muted mb-1 px-0.5">
          <span>Lower Risk</span>
          <span>Higher Risk</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => {
            const active = i === level;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full flex items-center justify-center rounded-[4px] font-bold text-white relative"
                  style={{
                    backgroundColor: RISK_COLORS[i - 1],
                    height: "22px",
                    fontSize: "11px",
                    outline: active ? "2px solid #0B1F3A" : "none",
                    outlineOffset: "1px",
                    boxShadow: active ? "0 0 0 1px #fff inset" : "none",
                  }}
                >
                  {active && (
                    <div className="absolute inset-0 rounded-[4px] border-2 border-white" />
                  )}
                  {i}
                </div>
                {active ? (
                  <svg width="8" height="6" viewBox="0 0 12 8">
                    <polygon points="6,0 12,8 0,8" fill="#0B1F3A" />
                  </svg>
                ) : (
                  <div className="h-[6px]" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-center text-[9px] font-semibold text-muted">
          {RISK_LABELS[level - 1]}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="text-center">
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-0.5">Risk-band</div>
        <div className="text-[18px] font-bold text-heading tracking-tight">RISK-LEVEL {level}</div>
        {title && <div className="text-[13px] text-body mt-0.5">{title}</div>}
        {subtitle && <div className="text-[11px] text-muted mt-0.5">{subtitle}</div>}
      </div>

      <div className="w-full">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted mb-1.5 px-0.5">
          <span>Lower Risk</span>
          <span>Higher Risk</span>
        </div>

        {/* Boxes */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => {
            const active = i === level;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full flex items-center justify-center rounded-[6px] font-bold text-white relative"
                  style={{
                    backgroundColor: RISK_COLORS[i - 1],
                    height: "44px",
                    fontSize: "18px",
                    outline: active ? "3px solid #0B1F3A" : "none",
                    outlineOffset: "2px",
                    boxShadow: active ? "0 0 0 1px #fff inset" : "none",
                  }}
                >
                  {active && (
                    <div
                      className="absolute inset-0 rounded-[6px] border-[2.5px] border-white"
                    />
                  )}
                  {i}
                </div>
                {/* Triangle pointer under active */}
                {active ? (
                  <svg width="12" height="8" viewBox="0 0 12 8">
                    <polygon points="6,0 12,8 0,8" fill="#0B1F3A" />
                  </svg>
                ) : (
                  <div className="h-2" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-1.5 text-center text-[10px] font-semibold text-muted">
          {RISK_LABELS[level - 1]}
        </div>
      </div>
    </div>
  );
}
