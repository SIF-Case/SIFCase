"use client";

import { useState } from "react";

type TabKey = "performance" | "risk" | "portfolio" | "manager" | "documents";

interface TabConfig {
  key: TabKey;
  label: string;
  badge?: string;
}

const TABS: TabConfig[] = [
  { key: "performance", label: "Performance" },
  { key: "risk", label: "Risk Analytics", badge: "NEW" },
  { key: "portfolio", label: "Portfolio" },
  { key: "manager", label: "Fund Manager" },
  { key: "documents", label: "Documents" },
];

export function FundTabs({
  performance,
  risk,
  portfolio,
  manager,
  documents,
}: {
  performance: React.ReactNode;
  risk: React.ReactNode;
  portfolio?: React.ReactNode;
  manager?: React.ReactNode;
  documents?: React.ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("performance");

  const panels: Record<TabKey, React.ReactNode> = {
    performance,
    risk,
    portfolio: portfolio ?? (
      <div className="px-6 py-10 text-center text-[13px] text-[#6B8299]">
        Portfolio data not available yet.
      </div>
    ),
    manager: manager ?? (
      <div className="px-6 py-10 text-center text-[13px] text-[#6B8299]">
        Fund manager data not available yet.
      </div>
    ),
    documents: documents ?? (
      <div className="px-6 py-10 text-center text-[13px] text-[#6B8299]">
        No documents available yet.
      </div>
    ),
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#E2E8EE] px-2 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              active === tab.key
                ? "border-[#0E9F8E] text-[#0E9F8E]"
                : "border-transparent text-[#6B8299] hover:text-[#3D5166]"
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wide bg-[#0E9F8E] text-white px-1.5 py-0.5 rounded-full leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Panel */}
      <div>{panels[active]}</div>
    </div>
  );
}
