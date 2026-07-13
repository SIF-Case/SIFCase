"use client";

import { useState } from "react";
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
          className={`text-[11px] font-normal nums flex items-center gap-1 ${
            neg ? "text-red-400" : "text-[#05df72]"
          }`}
        >
          {change}
          <span className="text-[9px] opacity-70">1D</span>
        </span>
      )}
    </span>
  );
}

export function TickerRibbon({ navItems }: { navItems: TickerNav[] }) {
  const [isVisible, setIsVisible] = useState(true);

  if (navItems.length === 0) return null;
  if (!isVisible) return null;

  const doubled = [...navItems, ...navItems];

  return (
    <div className="bg-[#0D1117] overflow-hidden flex items-center py-[6px] relative">
      <div className="ticker-track flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <TickerItem key={i} {...item} />
        ))}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors p-1"
        aria-label="Close ticker"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
