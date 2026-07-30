"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HelpTip } from "@/components/ui/HelpTip";
import { FUND_OPTION_HELP } from "@/lib/controlHelp";

/**
 * `?variant=reinvest` only changes which ISIN is shown and which plan/option
 * chip is highlighted. Reading it on the server made every fund page render
 * per-request (searchParams is request data, so the route opts out of static
 * rendering entirely). Reading it here instead keeps /sifs/[code] prerendered
 * and ISR-cached, which is the whole point of `export const revalidate`.
 */

export function VariantIsin({ isin, reinvestIsin }: { isin: string | null; reinvestIsin: string | null }) {
  const isReinvest = useSearchParams().get("variant") === "reinvest";
  const value = isReinvest && reinvestIsin ? reinvestIsin : isin;
  if (!value) return null;
  return (
    <>
      <span>ISIN {value}</span>
      <span className="text-white/25">·</span>
    </>
  );
}

export type VariantChip = {
  option: string;
  schemeCode: string;
  href: string;
  isVirtualReinvest: boolean;
};

export function VariantSwitcher({
  chips,
  currentSchemeCode,
  currentOption,
}: {
  chips: VariantChip[];
  currentSchemeCode: string;
  currentOption: string;
}) {
  const isReinvest = useSearchParams().get("variant") === "reinvest";

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((v) => {
        const isCurrent = v.isVirtualReinvest
          ? isReinvest && v.schemeCode === currentSchemeCode
          : !isReinvest && v.schemeCode === currentSchemeCode && v.option === currentOption;

        const help = FUND_OPTION_HELP[v.option];
        const chip = isCurrent ? (
          <span
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#0E9F8E] text-white border border-[#0E9F8E]"
          >
            {v.option}
          </span>
        ) : (
          <Link
            href={v.href}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/60 border border-white/15 hover:bg-white/20 hover:text-white transition-colors"
          >
            {v.option}
          </Link>
        );
        return help ? (
          <HelpTip key={`${v.schemeCode}-${v.option}`} {...help} side="bottom">{chip}</HelpTip>
        ) : (
          <div key={`${v.schemeCode}-${v.option}`}>{chip}</div>
        );
      })}
    </div>
  );
}
