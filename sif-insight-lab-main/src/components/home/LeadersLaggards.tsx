import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Zap, Plus, Check } from "lucide-react";
import { FUNDS, type Fund } from "@/lib/data";
import { Sparkline } from "@/components/ui-bits/Sparkline";
import { useCompareTray } from "./CompareTray";

export function LeadersLaggards() {
  const { top, bottom, movers } = useMemo(() => {
    const sorted = [...FUNDS].sort((a, b) => b.returns.m1 - a.returns.m1);
    const top = sorted.slice(0, 3);
    const bottom = sorted.slice(-3).reverse();
    const movers = [...FUNDS]
      .map((f) => ({ f, delta: f.returns.m1 - f.returns.m3 / 3 }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);
    return { top, bottom, movers };
  }, []);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">This Month</div>
        <h3 className="mt-1 text-[15px] font-semibold">Who won. Who lost. Who moved.</h3>
      </div>
      <Group icon={TrendingUp} label="Top 3" tone="positive" funds={top.map((f) => ({ f, val: f.returns.m1 }))} />
      <Group icon={TrendingDown} label="Bottom 3" tone="negative" funds={bottom.map((f) => ({ f, val: f.returns.m1 }))} />
      <Group icon={Zap} label="Biggest movers" tone="gold" funds={movers.map((m) => ({ f: m.f, val: m.delta }))} />
    </div>
  );
}

function Group({
  icon: Icon, label, tone, funds,
}: {
  icon: typeof TrendingUp;
  label: string;
  tone: "positive" | "negative" | "gold";
  funds: { f: Fund; val: number }[];
}) {
  const color = `var(--color-${tone})`;
  return (
    <div className="px-5 py-3 border-b border-border last:border-0 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-3.5" style={{ color }} />
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {funds.map(({ f, val }) => (
          <Row key={f.id + label} f={f} val={val} tone={tone} />
        ))}
      </ul>
    </div>
  );
}

function Row({ f, val, tone }: { f: Fund; val: number; tone: "positive" | "negative" | "gold" }) {
  const { toggle, has } = useCompareTray();
  const inTray = has(f.id);
  const valueColor = tone === "gold" ? (val >= 0 ? "text-positive" : "text-negative") : tone === "positive" ? "text-positive" : "text-negative";
  return (
    <li className="group flex items-center gap-2.5 py-1.5 px-1 rounded-md hover:bg-surface-2 transition-colors">
      <Link to="/fund/$id" params={{ id: f.id }} className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium truncate">{f.name.replace(/\s*Fund\s*$/, "")}</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground truncate">{f.amc}</div>
        </div>
        <div className="w-12 h-5 shrink-0 opacity-70">
          <Sparkline data={f.spark} stroke={val >= 0 ? "var(--color-positive)" : "var(--color-negative)"} />
        </div>
        <div className={`tabular text-[12px] font-semibold w-14 text-right ${valueColor}`}>
          {val >= 0 ? "+" : ""}{val.toFixed(2)}%
        </div>
      </Link>
      <button
        onClick={() => toggle(f.id)}
        title={inTray ? "Remove from compare" : "Add to compare"}
        className={`size-6 inline-flex items-center justify-center rounded-md border transition ${
          inTray ? "bg-primary text-primary-foreground border-primary" : "border-border-strong text-muted-foreground hover:text-foreground hover:bg-surface-2"
        }`}
      >
        {inTray ? <Check className="size-3" /> : <Plus className="size-3" />}
      </button>
    </li>
  );
}
