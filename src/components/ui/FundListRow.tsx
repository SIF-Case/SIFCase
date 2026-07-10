'use client';

import Link from "next/link";
import { Plus, Check, ArrowUpRight } from "lucide-react";
import type { FundRow } from "@/lib/sifData";
import { useCompareTray } from "@/components/ui/CompareTray";
import { Sparkline } from "@/components/ui/Sparkline";
import { fundHref } from "@/lib/slugify";

function shortName(name: string) {
  return name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim();
}

export function FundListRow({ f }: { f: FundRow }) {
  const siReturn = f.returns["SI"];
  const positive = siReturn !== null ? siReturn >= 0 : true;
  const { has, toggle } = useCompareTray();
  const inTray = has(f.schemeCode);
  const spark = f.sparklines["SI"];

  return (
    <div className="group grid grid-cols-[minmax(0,2.2fr)_88px_72px_64px_64px_96px_auto] items-center gap-4 px-5 py-3 border-b border-rule hover:bg-surface transition-colors tabular text-[13px]">
      <div className="min-w-0">
        <Link href={fundHref(f.fundName, f.schemeCode)} className="font-medium truncate block hover:text-primary">
          {shortName(f.name)}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted truncate">
          <span className="truncate">{f.amc}</span>
          <span className="text-rule">·</span>
          <span className="font-mono uppercase tracking-widest text-primary text-[10px]">{f.strategy}</span>
        </div>
      </div>
      <div className="text-right">
        {f.aum !== null ? `₹${f.aum.toFixed(0)} Cr` : <span className="text-muted">—</span>}
      </div>
      <div className={`text-right font-medium ${siReturn === null ? "text-muted" : positive ? "text-gain" : "text-loss"}`}>
        {siReturn === null ? "—" : `${positive ? "+" : ""}${siReturn.toFixed(2)}%`}
      </div>
      <div className="text-right">
        {f.sharpes["SI"] !== null ? f.sharpes["SI"]!.toFixed(2) : <span className="text-muted">—</span>}
      </div>
      <div className="text-right text-muted">
        {f.drawdowns["SI"] !== null ? `${f.drawdowns["SI"]!.toFixed(1)}%` : "—"}
      </div>
      <div className="h-7">
        {spark.length > 1 ? (
          <Sparkline data={spark} stroke={positive ? "var(--color-gain)" : "var(--color-loss)"} />
        ) : (
          <span className="text-[11px] text-muted">Insufficient history</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 justify-end">
        <button
          onClick={() => toggle(f.schemeCode)}
          aria-pressed={inTray}
          title={inTray ? "Remove from compare" : "Add to compare"}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-full border transition shrink-0 ${
            inTray
              ? "border-primary bg-primary/10 text-primary"
              : "border-rule hover:border-rule-strong text-muted hover:text-body"
          }`}
        >
          {inTray ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        </button>
        <Link
          href={fundHref(f.fundName, f.schemeCode)}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-rule hover:border-rule-strong text-muted hover:text-body transition"
          title="Open fund"
        >
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function FundListHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,2.2fr)_88px_72px_64px_64px_96px_auto] items-center gap-4 px-5 py-3 border-b border-rule bg-mist text-[10px] font-mono uppercase tracking-widest text-muted">
      <div>Fund</div>
      <div className="text-right">AUM</div>
      <div className="text-right">SI Return</div>
      <div className="text-right">Sharpe</div>
      <div className="text-right">Drawdown</div>
      <div>Trend</div>
      <div className="text-right">Actions</div>
    </div>
  );
}
