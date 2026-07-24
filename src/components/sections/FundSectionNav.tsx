"use client";

import { useEffect, useRef, useState } from "react";

// Sticky in-page navigation for the fund detail page. All sections are rendered
// on the page; clicking an item smooth-scrolls to that section and a scrollspy
// keeps the active item in sync with the scroll position. Sticks below the
// global 64px navbar.

type Item = { id: string; label: string; badge?: string };

const ITEMS: Item[] = [
  { id: "performance", label: "Performance" },
  { id: "risk-analytics", label: "Risk Analytics" },
  { id: "portfolio", label: "Portfolio" },
  { id: "fund-manager", label: "Fund Manager" },
  { id: "documents", label: "Documents" },
];

// navbar (64) + this sticky bar (~58) + a little breathing room
const SCROLL_LINE = 150;

export function FundSectionNav() {
  const [active, setActive] = useState(ITEMS[0].id);
  const clickLock = useRef(false);

  useEffect(() => {
    const sections = ITEMS
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    const onScroll = () => {
      if (clickLock.current) return;
      let current = sections[0]?.id ?? ITEMS[0].id;
      for (const s of sections) {
        if (s.getBoundingClientRect().top - SCROLL_LINE <= 0) current = s.id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    // Suppress scrollspy while the smooth-scroll animation runs, else it flickers
    // through intermediate sections.
    clickLock.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      clickLock.current = false;
    }, 700);
  };

  return (
    <div className="sticky top-16 z-30">
      <div className="bg-white border border-[#E2E8EE] rounded-[14px] shadow-[0_4px_16px_rgba(11,31,58,0.06)] flex gap-1 p-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        {ITEMS.map((i) => {
          const on = active === i.id;
          return (
            <button
              key={i.id}
              onClick={() => go(i.id)}
              className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${on ? "bg-[#0E2A47] text-white" : "text-[#6B8299] hover:bg-[#EEF2F8] hover:text-[#0E2A47]"
                }`}
            >
              {i.label}
              {i.badge && (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none ${on ? "bg-white text-[#0B7F73]" : "bg-[#0E9F8E] text-white"
                    }`}
                >
                  {i.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
