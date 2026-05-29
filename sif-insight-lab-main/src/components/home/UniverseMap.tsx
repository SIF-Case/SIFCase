import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FUNDS, type Fund } from "@/lib/data";

const ASSET: Record<string, "Hybrid" | "Equity" | "Debt"> = {
  "Long-Short": "Equity", "Market Neutral": "Equity", "Quant": "Equity", "Event Driven": "Equity",
  "Multi-Asset": "Hybrid", "Hybrid Long-Short": "Hybrid",
  "Arbitrage": "Debt", "Credit Opportunities": "Debt",
};
const classOf = (f: Fund) => ASSET[f.category] || ASSET[f.strategy] || "Equity";

const COLOR: Record<"Hybrid" | "Equity" | "Debt", string> = {
  Equity: "var(--color-primary)",
  Hybrid: "var(--color-gold)",
  Debt: "var(--color-positive)",
};

export function UniverseMap() {
  const [filter, setFilter] = useState<"All" | "Hybrid" | "Equity" | "Debt">("All");
  const [hover, setHover] = useState<string | null>(null);

  const data = useMemo(() => FUNDS.map((f) => ({
    f, x: f.metrics.vol, y: f.returns.y1, r: Math.sqrt(f.aum) * 1.3, c: classOf(f),
  })), []);
  const shown = filter === "All" ? data : data.filter((d) => d.c === filter);

  const W = 920, H = 460, PADL = 56, PADR = 24, PADT = 28, PADB = 44;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;

  const xMin = 0, xMax = Math.max(...data.map((d) => d.x)) * 1.15;
  const yMin = Math.min(...data.map((d) => d.y)) - 2;
  const yMax = Math.max(...data.map((d) => d.y)) + 2;

  const xAt = (v: number) => PADL + ((v - xMin) / (xMax - xMin)) * innerW;
  const yAt = (v: number) => PADT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const xMid = (xMin + xMax) / 2;
  const yMid = (yMin + yMax) / 2;

  const xTicks = 5, yTicks = 5;
  const xVals = Array.from({ length: xTicks + 1 }, (_, i) => xMin + ((xMax - xMin) * i) / xTicks);
  const yVals = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  return (
    <section className="border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Universe Map</div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">Risk · Return · Size — at once.</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-2xl">
              Each bubble is a SIF. X = annualised volatility · Y = 1-year return · Bubble size = AUM · Color = asset class.
              The top-left quadrant is the holy grail: high return at low risk.
            </p>
          </div>
          <div className="inline-flex p-1 rounded-full border border-border-strong bg-surface">
            {(["All", "Equity", "Hybrid", "Debt"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`h-8 px-4 rounded-full text-[12px] font-medium transition inline-flex items-center gap-1.5 ${
                  filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k !== "All" && <span className="size-1.5 rounded-full" style={{ background: COLOR[k] }} />}
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            {/* quadrant fill */}
            <rect x={PADL} y={PADT} width={xAt(xMid) - PADL} height={yAt(yMid) - PADT} fill="var(--color-positive)" opacity="0.04" />
            <rect x={xAt(xMid)} y={yAt(yMid)} width={W - PADR - xAt(xMid)} height={H - PADB - yAt(yMid)} fill="var(--color-negative)" opacity="0.04" />

            {/* gridlines */}
            {xVals.map((t, i) => (
              <g key={`x${i}`}>
                <line x1={xAt(t)} x2={xAt(t)} y1={PADT} y2={H - PADB} stroke="var(--color-border)" strokeDasharray="2 4" />
                <text x={xAt(t)} y={H - PADB + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}>
                  {t.toFixed(0)}%
                </text>
              </g>
            ))}
            {yVals.map((t, i) => (
              <g key={`y${i}`}>
                <line x1={PADL} x2={W - PADR} y1={yAt(t)} y2={yAt(t)} stroke="var(--color-border)" strokeDasharray="2 4" />
                <text x={PADL - 8} y={yAt(t) + 3} textAnchor="end" className="fill-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}>
                  {t >= 0 ? "+" : ""}{t.toFixed(1)}%
                </text>
              </g>
            ))}

            {/* quadrant axes */}
            <line x1={xAt(xMid)} x2={xAt(xMid)} y1={PADT} y2={H - PADB} stroke="var(--color-border-strong)" />
            <line x1={PADL} x2={W - PADR} y1={yAt(yMid)} y2={yAt(yMid)} stroke="var(--color-border-strong)" />

            {/* quadrant labels */}
            <QuadLabel x={PADL + 8} y={PADT + 14} text="HIGH RETURN · LOW RISK" tone="positive" anchor="start" />
            <QuadLabel x={W - PADR - 8} y={PADT + 14} text="HIGH RETURN · HIGH RISK" tone="gold" anchor="end" />
            <QuadLabel x={PADL + 8} y={H - PADB - 6} text="LOW RETURN · LOW RISK" tone="muted" anchor="start" />
            <QuadLabel x={W - PADR - 8} y={H - PADB - 6} text="LOW RETURN · HIGH RISK" tone="negative" anchor="end" />

            {/* axis titles */}
            <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-foreground" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: 1 }}>
              VOLATILITY (ANNUALISED)
            </text>
            <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="fill-foreground" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: 1 }}>
              1Y RETURN
            </text>

            {/* bubbles */}
            {shown.map(({ f, x, y, r, c }) => {
              const active = hover === f.id;
              return (
                <g key={f.id} onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                  <Link to="/fund/$id" params={{ id: f.id }}>
                    <circle cx={xAt(x)} cy={yAt(y)} r={r} fill={COLOR[c]} opacity={active ? 0.5 : 0.28} />
                    <circle cx={xAt(x)} cy={yAt(y)} r={r} fill="none" stroke={COLOR[c]} strokeWidth={active ? 2 : 1.2} />
                    {active && (
                      <text x={xAt(x)} y={yAt(y) - r - 6} textAnchor="middle" className="fill-foreground" style={{ fontSize: 10, fontWeight: 600 }}>
                        {f.name.replace(/\s*(SIF|Fund)\s*$/, "")}
                      </text>
                    )}
                  </Link>
                </g>
              );
            })}
          </svg>

          {/* hover detail card */}
          {hover && (() => {
            const d = shown.find((x) => x.f.id === hover);
            if (!d) return null;
            const f = d.f;
            return (
              <div className="absolute top-4 right-4 w-64 bg-surface-2 border border-border-strong rounded-xl p-4 shadow-2xl shadow-black/40">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: COLOR[d.c] }}>{d.c} · {f.strategy}</div>
                <div className="mt-1 text-[13px] font-semibold leading-tight">{f.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{f.amc}</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
                  <Cell label="1Y Return" value={`${f.returns.y1 >= 0 ? "+" : ""}${f.returns.y1}%`} tone={f.returns.y1 >= 0 ? "pos" : "neg"} />
                  <Cell label="Volatility" value={`${f.metrics.vol}%`} />
                  <Cell label="AUM" value={`₹${f.aum.toFixed(0)}Cr`} />
                  <Cell label="Sharpe" value={f.metrics.sharpe.toFixed(2)} />
                  <Cell label="Drawdown" value={`${f.metrics.drawdown}%`} tone="neg" />
                  <Cell label="Risk" value={`${f.risk}/5`} />
                </div>
              </div>
            );
          })()}

          {/* legend */}
          <div className="mt-2 flex flex-wrap items-center gap-4 px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Bubble size = AUM</span>
            <span className="ml-auto flex items-center gap-3">
              {(["Equity", "Hybrid", "Debt"] as const).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: COLOR[c] }} /> {c}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuadLabel({ x, y, text, tone, anchor }: { x: number; y: number; text: string; tone: "positive" | "negative" | "gold" | "muted"; anchor: "start" | "end" }) {
  const fill =
    tone === "positive" ? "var(--color-positive)" :
    tone === "negative" ? "var(--color-negative)" :
    tone === "gold" ? "var(--color-gold)" : "var(--color-muted-foreground)";
  return (
    <text x={x} y={y} textAnchor={anchor} style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: 1.2, fontWeight: 600 }} fill={fill}>
      {text}
    </text>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`tabular font-medium ${tone === "pos" ? "text-positive" : tone === "neg" ? "text-negative" : ""}`}>{value}</div>
    </div>
  );
}
