import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About SIFHub" }, { name: "description", content: "SIFHub is India's institutional intelligence platform for Specialized Investment Funds." }] }),
  component: About,
});

function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-10">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">About</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Built for the sophisticated investor.</h1>
        <p className="mt-6 text-[15px] text-muted-foreground leading-relaxed">
          SIFHub is India's first dedicated intelligence platform for Specialized Investment Funds. We bring hedge-fund-grade
          research, portfolio transparency and strategy intelligence to HNIs, RIAs, distributors, and serious individual
          investors evaluating this new SEBI-regulated category.
        </p>
        <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
          Our coverage spans every active SIF in India, with monthly-refreshed portfolios, risk analytics, manager profiles,
          and educational frameworks designed to demystify alternative strategies.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {[["142", "Schemes tracked"], ["42", "AMCs covered"], ["₹42K Cr", "Industry AUM"]].map(([v, k]) => (
          <div key={k} className="bg-surface p-6">
            <div className="text-3xl font-semibold tabular">{v}</div>
            <div className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{k}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 text-[12px] text-muted-foreground leading-relaxed">
        <div className="text-[11px] font-mono uppercase tracking-widest text-foreground mb-2">Disclaimer</div>
        All content is for analytical purposes only and does not constitute investment advice. SIF investments involve
        capital risk including potential loss of principal. Please consult your financial and tax advisor before investing.
      </div>

      <Link to="/contact" className="inline-flex h-10 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold items-center">Get in touch →</Link>
    </div>
  );
}
