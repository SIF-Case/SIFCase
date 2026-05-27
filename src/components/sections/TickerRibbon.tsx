const ITEMS = [
  { label: "INDIA VIX", value: "12.84", change: "-2.14%", neg: true },
  { label: "USD/INR", value: "83.12", change: "+0.04%", neg: false },
  { label: "GOLD ₹/10G", value: "74,210", change: "-0.12%", neg: true },
  { label: "QSIF LONG-SHORT", value: "10.842", change: "+1.24%", neg: false },
  { label: "ALTIVA HYBRID L/S", value: "11.482", change: "+0.62%", neg: false },
  { label: "NUVAMA NEUTRAL", value: "10.142", change: "+0.18%", neg: false },
  { label: "EDELWEISS L-S SIF", value: "10.385", change: "+0.35%", neg: false },
  { label: "MOTILAL SIF", value: "9.940", change: "-0.08%", neg: true },
  { label: "MIRAE ASSET SIF", value: "10.228", change: "+0.51%", neg: false },
  { label: "KOTAK L-S SIF", value: "10.671", change: "+0.29%", neg: false },
];

function TickerItem({
  label,
  value,
  change,
  neg,
}: (typeof ITEMS)[0]) {
  return (
    <span className="inline-flex items-center gap-2 px-5 flex-shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-faint uppercase">
        {label}
      </span>
      <span className="text-[11px] font-bold text-heading nums">{value}</span>
      <span
        className={`text-[11px] font-semibold nums ${
          neg ? "text-loss" : "text-verified"
        }`}
      >
        {change}
      </span>
      <span className="text-rule-strong mx-1">·</span>
    </span>
  );
}

export function TickerRibbon() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-surface border-b border-rule overflow-hidden h-8 flex items-center">
      <div className="ticker-track flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <TickerItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
