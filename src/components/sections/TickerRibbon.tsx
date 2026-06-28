import type { TickerNav } from "@/lib/sifData";

function TickerItem({ label, value, change, neg }: TickerNav) {
  return (
    <span className="ticker-item inline-flex items-center gap-2 px-3 py-[6px] flex-shrink-0 border-r border-white/10">
      <span className="text-[11px] font-medium text-[#D1D5DC]">
        {label}
      </span>
      {value && (
        <span className="text-[11px] font-medium text-white nums">{value}</span>
      )}
      {change && (
        <span
          className={`text-[11px] font-normal nums ${
            neg ? "text-red-400" : "text-[#05df72]"
          }`}
        >
          {change}
        </span>
      )}
    </span>
  );
}

export function TickerRibbon({ navItems }: { navItems: TickerNav[] }) {
  if (navItems.length === 0) return null;
  const doubled = [...navItems, ...navItems];

  return (
    <div className="bg-[#0D1117] overflow-hidden flex items-center py-[6px]">
      <div className="ticker-track flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <TickerItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
