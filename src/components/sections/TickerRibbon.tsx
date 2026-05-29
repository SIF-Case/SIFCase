import type { TickerNav } from "@/lib/sifData";

function TickerItem({ label, value, change, neg }: TickerNav) {
  return (
    <span className="inline-flex items-center gap-2 px-5 flex-shrink-0">
      <span className="text-[11px] font-semibold tracking-wide text-faint uppercase">
        {label}
      </span>
      <span className="text-[11px] font-bold text-heading nums">{value}</span>
      <span className={`text-[11px] font-semibold nums ${neg ? "text-loss" : "text-verified"}`}>
        {change}
      </span>
      <span className="text-rule-strong mx-1">·</span>
    </span>
  );
}

export function TickerRibbon({ navItems }: { navItems: TickerNav[] }) {
  if (navItems.length === 0) return null;
  const doubled = [...navItems, ...navItems];

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
