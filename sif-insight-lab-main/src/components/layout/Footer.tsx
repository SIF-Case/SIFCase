import { Link } from "@tanstack/react-router";

export function Footer() {
  const COL = [
    {
      title: "Platform",
      items: [
        { to: "/explore", label: "Explore SIFs" },
        { to: "/compare", label: "Compare Funds" },
        { to: "/analytics", label: "Performance Analytics" },
        { to: "/market", label: "Market Dashboard" },
      ],
    },
    {
      title: "Research",
      items: [
        { to: "/research", label: "Research Reports" },
        { to: "/strategy", label: "Strategy Intelligence" },
        { to: "/learn", label: "Learn SIFs" },
        { to: "/tools", label: "Tools & Calculators" },
      ],
    },
    {
      title: "Institutional",
      items: [
        { to: "/about", label: "About SIFHub" },
        { to: "/contact", label: "Advisor Connect" },
        { to: "/contact", label: "Callback Request" },
      ],
    },
    {
      title: "Legal",
      items: [
        { to: "/about", label: "Disclaimer" },
        { to: "/about", label: "Privacy Policy" },
        { to: "/about", label: "Terms of Use" },
        { to: "/about", label: "SEBI Disclosure" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="max-w-[1440px] mx-auto px-6 py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-sm bg-primary" />
            <span className="font-semibold tracking-tight text-[15px]">
              SIF<span className="text-primary">Hub</span>
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-sm">
            India's institutional intelligence platform for Specialized Investment Funds. Research, compare, and analyze
            SIFs with hedge-fund grade depth.
          </p>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
            Data latency: live · refreshed monthly
          </div>
        </div>
        {COL.map((c) => (
          <div key={c.title} className="lg:col-span-2 space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-foreground">{c.title}</div>
            <ul className="space-y-2.5">
              {c.items.map((i, k) => (
                <li key={k}>
                  <Link to={i.to} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 h-12 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <div>© 2026 SIFHub · Research & Analytics</div>
          <div className="italic">
            For analytical purposes only · SIFs involve capital risk · Consult your financial & tax advisor
          </div>
        </div>
      </div>
    </footer>
  );
}
