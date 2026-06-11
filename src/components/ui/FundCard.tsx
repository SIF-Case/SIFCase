'use client';

import Link from "next/link";
import { Plus, Check } from "lucide-react";
import type { FundRow } from "@/lib/sifData";
import { useCompareTray } from "@/components/ui/CompareTray";
import { Sparkline } from "@/components/ui/Sparkline";
import { SEBIRiskometer } from "@/components/ui/RiskMeter";
import { SourceBadge } from "@/components/ui/SourceBadge";

export function FundCard({ f }: { f: FundRow }) {
  const siReturn = f.returns["SI"];
  const positive = siReturn !== null ? siReturn >= 0 : true;
  const { has, toggle } = useCompareTray();
  const inTray = has(f.schemeCode);
  const spark = f.sparklines["SI"];

  return (
    <div className="group bg-white rounded-[18px] border border-rule p-5 flex flex-col gap-4 shadow-card hover:shadow-premium hover:border-rule-strong transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/sifs/${f.schemeCode.toLowerCase()}`}
            className="block text-[16px] font-semibold text-heading leading-tight truncate group-hover:text-primary transition-colors"
          >
            {f.fundName}
          </Link>
          <div className="mt-1 text-[11px] text-muted truncate">By {f.amc}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-primary">{f.strategy}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted">NAV</div>
          <div className="mt-0.5 text-[15px] font-semibold tabular text-heading">₹{f.nav.toFixed(4)}</div>
          <div className="text-[10px] text-muted">{f.navDate}</div>
        </div>
      </div>

      {spark.length > 1 && (
        <div className="h-12">
          <Sparkline
            data={spark}
            stroke={positive ? "var(--color-gain)" : "var(--color-loss)"}
            fill={positive ? "var(--color-gain)" : "var(--color-loss)"}
          />
        </div>
      )}

      <div className="h-px bg-rule" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted">Since Inception</div>
            <div className={`mt-1 text-[16px] font-semibold tabular ${siReturn === null ? "text-muted" : siReturn >= 0 ? "text-gain" : "text-loss"}`}>
              {siReturn === null ? "Insufficient history" : `${siReturn >= 0 ? "+" : ""}${siReturn.toFixed(2)}%`}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted">1M Return</div>
            <div className={`mt-1 text-[14px] font-semibold tabular ${f.returns["1M"] === null ? "text-muted" : f.returns["1M"]! >= 0 ? "text-gain" : "text-loss"}`}>
              {f.returns["1M"] === null ? "—" : `${f.returns["1M"]! >= 0 ? "+" : ""}${f.returns["1M"]!.toFixed(2)}%`}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted">Sharpe (SI)</div>
            <div className="mt-1 text-[16px] font-semibold tabular text-heading">
              {f.sharpes["SI"] === null ? "—" : f.sharpes["SI"]!.toFixed(2)}
            </div>
          </div>
          {f.aum !== null && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted">AUM</div>
              <div className="mt-1 text-[14px] font-semibold tabular text-heading">₹{f.aum.toFixed(0)} Cr</div>
            </div>
          )}
        </div>
      </div>

      {f.riskBand != null && <SEBIRiskometer level={f.riskBand} size="sm" />}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => toggle(f.schemeCode)}
          aria-pressed={inTray}
          title={inTray ? "Remove from compare" : "Add to compare"}
          className={`h-10 w-10 inline-flex items-center justify-center rounded-full border transition shrink-0 ${
            inTray
              ? "border-primary bg-primary/10 text-primary"
              : "border-rule-strong hover:bg-surface text-muted hover:text-body"
          }`}
        >
          {inTray ? <Check className="size-4" /> : <Plus className="size-4" />}
        </button>
        <Link
          href={`/sifs/${f.schemeCode.toLowerCase()}`}
          className="flex-1 h-10 inline-flex items-center justify-center rounded-full border border-rule-strong text-[13px] font-medium hover:bg-surface transition"
        >
          Details
        </Link>
      </div>

      <SourceBadge variant="calculated" className="text-[9.5px]" />
    </div>
  );
}
