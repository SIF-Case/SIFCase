"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

type Scenario = { key: string; label: string; text: string; icon: React.ReactNode };

/**
 * Toggle-tab presentation of the bull/bear/sideways market-scenario copy.
 * Only renders tabs for scenarios that have text; the first available is active.
 */
export function ScenarioTabs({
  bull,
  bear,
  sideways,
}: {
  bull?: string;
  bear?: string;
  sideways?: string;
}) {
  const scenarios: Scenario[] = [
    bull && { key: "bull", label: "Bull Markets", text: bull, icon: <TrendingUp className="size-4 text-[#1A9E5F]" strokeWidth={2} /> },
    bear && { key: "bear", label: "Bear Markets", text: bear, icon: <TrendingDown className="size-4 text-[#F87171]" strokeWidth={2} /> },
    sideways && { key: "side", label: "Sideways Markets", text: sideways, icon: <ArrowLeftRight className="size-4 text-[#0E9F8E]" strokeWidth={2} /> },
  ].filter(Boolean) as Scenario[];

  const [active, setActive] = useState(scenarios[0]?.key ?? "");
  if (scenarios.length === 0) return null;
  const current = scenarios.find((s) => s.key === active) ?? scenarios[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {scenarios.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`text-[13px] font-semibold px-[15px] py-2 rounded-[9px] transition-colors ${
              s.key === current.key
                ? "bg-[#0E2A47] text-white"
                : "bg-[#EEF2F8] text-[#6B8299] hover:bg-[#E2E8EE]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="rounded-[12px] bg-[#F4F6F8] p-5">
        <div className="flex items-center gap-2 mb-2">
          {current.icon}
          <span className="text-[13px] font-bold text-[#0F1C28]">In {current.label}</span>
        </div>
        <p className="text-[14px] text-[#334155] leading-[1.65]">{current.text}</p>
      </div>
    </div>
  );
}
