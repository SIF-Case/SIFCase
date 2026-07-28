"use client";

import { useState } from "react";
import Link from "next/link";
import { FundCTAModal } from "@/components/ui/FundCTAModal";
import type { FundDetail, FundDetailsData } from "@/lib/sifData";

const linkCls =
  "block w-full text-left px-4 py-[9px] border-b border-[#E2E8EE] last:border-0 text-[13px] font-medium text-[#0E9F8E] hover:bg-[#F4F6F8] transition-colors";

export function QuickLinksCard({
  fund,
  fundDetails,
}: {
  fund: FundDetail;
  fundDetails: FundDetailsData | null;
}) {
  const [ctaOpen, setCtaOpen] = useState(false);

  const links = [
    { label: "Compare with other funds →", href: `/compare?funds=${encodeURIComponent(fund.schemeCode)}` },
    { label: "Learn how SIFs work →", href: "/sif-101" },
    { label: "View open NFOs →", href: "/nfos" },
  ];

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8EE] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E2E8EE]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.167 7.583a3.5 3.5 0 0 1-4.667.292M5.833 6.417a3.5 3.5 0 0 1 4.667-.292M8.167 13.75a5.833 5.833 0 1 0 0-11.667 5.833 5.833 0 0 0 0 11.667z" stroke="#0E9F8E" strokeWidth="1.17" />
        </svg>
        <span className="text-[13px] font-semibold text-[#0E2A47]">Quick links</span>
      </div>
      <div>
        {links.map(({ label, href }) => (
          <Link key={label} href={href} className={linkCls}>
            {label}
          </Link>
        ))}
        {/* Same callback flow as "Invest Online" — a mailto: dead-ends the
            journey and loses the lead, so this opens the request form instead. */}
        <button type="button" onClick={() => setCtaOpen(true)} className={linkCls}>
          Speak to a specialist →
        </button>
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
