"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { FundCTAModal } from "@/components/ui/FundCTAModal";
import { useCompareTray } from "@/components/ui/CompareTray";
import { HelpTip } from "@/components/ui/HelpTip";
import { FUND_INVEST_HELP, FUND_ADD_COMPARE_HELP } from "@/lib/controlHelp";
import type { FundDetail, FundDetailsData } from "@/lib/sifData";

export function NavActionCard({
  fund,
  navChange,
  navChangePositive,
  navChangePct,
  fundDetails,
  className,
}: {
  fund: FundDetail;
  navChange: number | null;
  navChangePositive: boolean;
  navChangePct: number | null;
  fundDetails: FundDetailsData | null;
  className?: string;
}) {
  const [ctaOpen, setCtaOpen] = useState(false);
  const { toggle, has } = useCompareTray();
  const added = has(fund.schemeCode);

  return (
    <div className={`rounded-[14px] border border-white/[0.07] bg-[#0E2A47] p-5 ${className ?? ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-white/[0.38] mb-1.5">
        Latest NAV
      </div>
      <div className="text-[30px] font-bold text-white leading-none tracking-[-0.9px]">
        ₹{fund.nav.toFixed(4)}
      </div>
      <div className="flex items-center gap-2 mt-2 mb-0.5">
        {navChange !== null && (
          <span className={`text-[14px] font-semibold ${navChangePositive ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
            {navChangePositive ? "+" : ""}₹{Math.abs(navChange).toFixed(4)}
            {navChangePct !== null && ` (${navChangePositive ? "+" : ""}${navChangePct.toFixed(2)}%)`}
          </span>
        )}
        <span className="text-[12px] text-white/[0.38]">{fund.navDate}</span>
      </div>

      {/* CTA buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <HelpTip {...FUND_INVEST_HELP} className="w-full">
          <button
            onClick={() => setCtaOpen(true)}
            className="w-full h-10 rounded-[8px] bg-[#0E9F8E] text-white text-[13px] font-semibold hover:bg-[#0a8577] transition-colors"
          >
            Invest Online
          </button>
        </HelpTip>
        <HelpTip {...FUND_ADD_COMPARE_HELP} className="w-full">
          <button
            onClick={() => toggle(fund.schemeCode)}
            className="w-full h-9 rounded-[8px] border border-white/[0.14] text-white/60 text-[12px] hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5"
          >
            {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            {added ? "Added to compare" : "Add to compare"}
          </button>
        </HelpTip>
      </div>

      <FundCTAModal
        open={ctaOpen}
        onClose={() => setCtaOpen(false)}
        fund={{ fundName: fund.fundName, schemeCode: fund.schemeCode, strategy: fund.strategy }}
        minInvestment={fundDetails?.minInvestment ?? null}
      />
    </div>
  );
}
