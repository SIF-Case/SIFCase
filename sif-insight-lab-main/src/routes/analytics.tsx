import { createFileRoute } from "@tanstack/react-router";
import { FUNDS } from "@/lib/data";
import { Sparkline } from "@/components/ui-bits/Sparkline";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Performance Analytics — SIFHub" }, { name: "description", content: "Institutional analytics: cumulative returns, rolling Sharpe, drawdowns, upside/downside capture." }] }),
  component: Analytics,
});

function Analytics() {
  const f = FUNDS[0];
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
      <header className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Analytics Terminal</div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Performance analytics</h1>
        <p className="text-[14px] text-muted-foreground max-w-2xl">Rolling returns, drawdown curves, volatility cones, and capture ratios — across every SIF in coverage.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {[
          { t: "Cumulative Returns", d: f.spark },
          { t: "Rolling Sharpe (12M)", d: f.spark.map((v, i) => 1 + Math.sin(i / 3) * 0.3) },
          { t: "Drawdown Curve", d: f.spark.map((_, i) => -Math.abs(Math.sin(i / 4) * 5)) },
          { t: "Volatility Cone", d: f.spark.map((v, i) => 10 + Math.cos(i / 5) * 4) },
          { t: "Upside Capture", d: f.spark.map((_, i) => 80 + Math.sin(i / 2) * 12) },
          { t: "Downside Capture", d: f.spark.map((_, i) => 40 + Math.cos(i / 2) * 8) },
        ].map((chart) => (
          <div key={chart.t} className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold">{chart.t}</h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{f.name}</span>
            </div>
            <div className="h-44"><Sparkline data={chart.d} width={600} height={180} fill="var(--color-primary)" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
