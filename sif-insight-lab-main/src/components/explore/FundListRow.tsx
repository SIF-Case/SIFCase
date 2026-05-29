import { Link } from "@tanstack/react-router";
import { Plus, Check, ArrowUpRight } from "lucide-react";
import type { Fund } from "@/lib/data";
import { useCompareTray } from "@/components/home/CompareTray";
import { Sparkline } from "@/components/ui-bits/Sparkline";

export function FundListRow({ f }: { f: Fund }) {
  const positive = f.returns.y1 >= 0;
  const { has, toggle } = useCompareTray();
  const inTray = has(f.id);
  return (
    <div className="group grid grid-cols-[minmax(0,2.2fr)_56px_88px_72px_64px_64px_64px_96px_auto] items-center gap-4 px-5 py-3 border-b border-border hover:bg-surface-2/60 transition-colors tabular text-[13px]">
      <div className="min-w-0">
        <Link to="/fund/$id" params={{ id: f.id }} className="font-medium truncate block hover:text-primary">
          {f.name.replace(/\s*Fund\s*$/, "")}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground truncate">
          <span className="truncate">{f.amc}</span>
          <span className="text-border">·</span>
          <span className="font-mono uppercase tracking-widest text-primary text-[10px]">{f.strategy}</span>
        </div>
      </div>
      <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        L{f.risk}
      </div>
      <div className="text-right">₹{f.aum.toFixed(0)} Cr</div>
      <div className={`text-right font-medium ${positive ? "text-positive" : "text-negative"}`}>
        {positive ? "+" : ""}{f.returns.y1.toFixed(2)}%
      </div>
      <div className="text-right">{f.metrics.sharpe.toFixed(2)}</div>
      <div className="text-right text-muted-foreground">{f.metrics.vol.toFixed(1)}%</div>
      <div className="text-right text-muted-foreground">{f.expense.toFixed(2)}%</div>
      <div className="h-7">
        <Sparkline data={f.spark} stroke={positive ? "var(--color-positive)" : "var(--color-negative)"} />
      </div>
      <div className="flex items-center gap-1.5 justify-end">
        <button
          onClick={() => toggle(f.id)}
          aria-pressed={inTray}
          title={inTray ? "Remove from compare" : "Add to compare"}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-full border transition shrink-0 ${
            inTray
              ? "border-primary bg-primary/15 text-primary"
              : "border-border hover:border-border-strong text-muted-foreground hover:text-foreground"
          }`}
        >
          {inTray ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        </button>
        <Link
          to="/fund/$id"
          params={{ id: f.id }}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border hover:border-border-strong text-muted-foreground hover:text-foreground transition"
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
    <div className="grid grid-cols-[minmax(0,2.2fr)_56px_88px_72px_64px_64px_64px_96px_auto] items-center gap-4 px-5 py-3 border-b border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      <div>Fund</div>
      <div className="text-center">Risk</div>
      <div className="text-right">AUM</div>
      <div className="text-right">1Y</div>
      <div className="text-right">Sharpe</div>
      <div className="text-right">Vol</div>
      <div className="text-right">Exp</div>
      <div>Trend</div>
      <div className="text-right">Actions</div>
    </div>
  );
}
