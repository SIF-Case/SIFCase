import { createFileRoute, Link } from "@tanstack/react-router";
import { STRATEGIES } from "@/lib/data";

export const Route = createFileRoute("/strategy")({
  head: () => ({ meta: [{ title: "Strategy Intelligence — SIFHub" }, { name: "description", content: "Deep-dives on each SIF strategy: long-short, market neutral, arbitrage, multi-asset, quant, event-driven and more." }] }),
  component: StrategyHub,
});

function StrategyHub() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
      <header className="space-y-3 max-w-3xl">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Strategy Hub</div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">The eight SIF strategy archetypes</h1>
        <p className="text-[14px] text-muted-foreground">
          Each SIF expresses a specific worldview. Understand what it is, how it works, the risk profile, ideal market conditions, and who should use it.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {STRATEGIES.map((s) => (
          <article key={s.slug} className="bg-surface border border-border rounded-xl p-7 hover:border-border-strong transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{s.name}</h2>
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">{s.risk} Risk</span>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">{s.desc}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-[12px]">
              <Pair k="Ideal regime" v="Trending / Volatile" />
              <Pair k="Return source" v="Alpha + spread" />
              <Pair k="Beta exposure" v="Variable" />
              <Pair k="Investor profile" v="Sophisticated" />
            </dl>

            <Link to="/explore" className="mt-6 inline-flex text-[12px] text-primary font-medium">View funds in this strategy →</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-l border-border pl-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="text-[13px]">{v}</div>
    </div>
  );
}
