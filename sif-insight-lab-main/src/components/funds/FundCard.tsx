import { Link } from "@tanstack/react-router";
import { Plus, Check } from "lucide-react";
import type { Fund } from "@/lib/data";
import { useCompareTray } from "@/components/home/CompareTray";

export function FundCard({ f }: { f: Fund }) {
  const positive = f.returns.y1 >= 0;
  const { has, toggle } = useCompareTray();
  const inTray = has(f.id);
  return (
    <div className="group bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-strong hover:shadow-xl hover:shadow-black/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/fund/$id"
            params={{ id: f.id }}
            className="block text-[18px] font-semibold leading-tight truncate group-hover:text-primary transition-colors"
          >
            {f.name.replace(/\s*Fund\s*$/, "").replace(/\s*SIF\s*$/, "")}
          </Link>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">By {f.amc}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">NAV</div>
          <div className="mt-0.5 text-[15px] font-semibold tabular">₹{f.nav.toFixed(2)}</div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">AUM</div>
            <div className="mt-1 text-[16px] font-semibold tabular">₹{f.aum.toFixed(2)} Cr</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sharpe</div>
            <div className="mt-1 text-[16px] font-semibold tabular">{f.metrics.sharpe.toFixed(2)}</div>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">1yr Returns</div>
            <div className={`mt-1 text-[16px] font-semibold tabular ${positive ? "text-positive" : "text-negative"}`}>
              {positive ? "+" : ""}{f.returns.y1.toFixed(2)}%
            </div>
          </div>
          <div className="flex justify-start">
            <RiskGauge level={f.risk} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => toggle(f.id)}
          aria-pressed={inTray}
          title={inTray ? "Remove from compare" : "Add to compare"}
          className={`h-10 w-10 inline-flex items-center justify-center rounded-full border transition shrink-0 ${
            inTray
              ? "border-primary bg-primary/15 text-primary"
              : "border-border-strong hover:bg-surface-2 text-muted-foreground hover:text-foreground"
          }`}
        >
          {inTray ? <Check className="size-4" /> : <Plus className="size-4" />}
        </button>
        <Link
          to="/fund/$id"
          params={{ id: f.id }}
          className="flex-1 h-10 inline-flex items-center justify-center rounded-full border border-border-strong text-[13px] font-medium hover:bg-surface-2 transition"
        >
          Details
        </Link>
        <Link
          to="/contact"
          className="flex-1 h-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition"
        >
          Invest
        </Link>
      </div>
    </div>
  );
}

function RiskGauge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const segs = [
    { color: "var(--color-positive)" },
    { color: "#a3d977" },
    { color: "var(--color-gold)" },
    { color: "#f0915a" },
    { color: "var(--color-negative)" },
  ];
  const cx = 50, cy = 50, r = 40;
  const segAngle = 180 / 5;
  const needleDeg = -180 + segAngle * (level - 0.5);
  const rad = (needleDeg * Math.PI) / 180;
  const nx = cx + (r - 6) * Math.cos(rad);
  const ny = cy + (r - 6) * Math.sin(rad);

  const arc = (i: number) => {
    const a1 = (-180 + i * segAngle) * Math.PI / 180;
    const a2 = (-180 + (i + 1) * segAngle) * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="w-[110px]">
      <svg viewBox="0 0 100 60" className="w-full h-auto">
        {segs.map((s, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={s.color} strokeWidth="9" strokeLinecap="butt" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--color-foreground)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3" fill="var(--color-foreground)" />
      </svg>
      <div className="text-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground -mt-1">
        {["Low", "Low-Mod", "Moderate", "Mod-High", "High"][level - 1]} risk
      </div>
    </div>
  );
}
