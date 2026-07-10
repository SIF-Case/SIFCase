"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { FundCTAModal } from "@/components/ui/FundCTAModal";
import type { FundDetail, FundDetailsData } from "@/lib/sifData";

function fmtInr(n: number | null): string {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtCr(n: number | null): string {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

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

      {/* Sidebar stats */}
      <div className="mt-4 space-y-0 border-t border-white/[0.07] pt-2">
        {[
          { label: "AUM", value: fmtCr(fund.aum ?? fundDetails?.aumCurrent ?? null) },
          { label: "Min investment", value: fmtInr(fundDetails?.minInvestment ?? null) },
          { label: "Exit load", value: fundDetails?.exitLoad ?? "—" },
          { label: "Expense ratio", value: fund.expenseRatio !== null ? `${fund.expenseRatio}%` : (fundDetails?.terMax || "—") },
          { label: "Since inception", value: fund.returns.SI !== null ? `${fund.returns.SI >= 0 ? "+" : ""}${fund.returns.SI.toFixed(1)}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.07] last:border-0">
            <span className="text-[13px] text-white/[0.42]">{label}</span>
            <span className="text-[13px] font-medium text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="mt-4 space-y-2">
        <button
          onClick={() => setCtaOpen(true)}
          className="w-full h-10 rounded-[8px] bg-[#0E9F8E] text-white text-[13px] font-semibold hover:bg-[#0a8577] transition-colors"
        >
          Invest Online
        </button>
        <Link
          href={`/compare?funds=${encodeURIComponent(fund.schemeCode)}`}
          className="w-full h-9 rounded-[8px] border border-white/[0.14] text-white/60 text-[12px] hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="size-3.5" />
          Add to compare
        </Link>
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
