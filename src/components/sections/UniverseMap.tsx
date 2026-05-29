'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FundRow } from "@/lib/sifData";

function computeVol(navs: number[]): number {
  if (navs.length < 3) return 0;
  const rets = navs.slice(1).map((v, i) => (v - navs[i]) / navs[i]);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(rets.length - 1, 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

const CATEGORY_COLOR: Record<string, string> = {
  Equity: "var(--color-primary)",
  Hybrid: "var(--color-caution)",
};

type Props = { funds: FundRow[] };

export function UniverseMap({ funds }: Props) {
  const [filter, setFilter] = useState<"All" | "Equity" | "Hybrid">("All");
  const [hover, setHover] = useState<string | null>(null);

  const data = useMemo(() =>
    funds
      .map((f) => ({
        f,
        x: computeVol(f.sparklines["SI"]),
        y: f.returns["SI"] ?? 0,
        r: f.aum ? Math.sqrt(f.aum) * 1.3 : 8,
        c: f.category,
      }))
      .filter((d) => d.x > 0 || d.y !== 0),
  [funds]);

  const shown = filter === "All" ? data : data.filter((d) => d.c === filter);

  if (data.length === 0) return null;

  const W = 920, H = 460, PADL = 56, PADR = 24, PADT = 28, PADB = 44;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;

  const xMax = Math.max(...data.map((d) => d.x), 1) * 1.15;
  const yMin = Math.min(...data.map((d) => d.y)) - 2;
  const yMax = Math.max(...data.map((d) => d.y)) + 2;
  const xMid = xMax / 2;
  const yMid = (yMin + yMax) / 2;

  const xAt = (v: number) => PADL + (v / xMax) * innerW;
  const yAt = (v: number) => PADT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const xTicks = Array.from({ length: 6 }, (_, i) => (xMax * i) / 5);
  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + ((yMax - yMin) * i) / 5);

  return (
    <section className="border-b border-rule bg-white">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-section">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Universe Map</p>
            <h2 className="text-[28px] font-bold text-heading tracking-[-0.3px] mb-1">Risk · Return · Size — at once.</h2>
            <p className="text-[15px] text-muted max-w-2xl">
              Each bubble is a SIF. X = annualised volatility · Y = return since inception · Bubble size = AUM.
              Top-left = high return at low risk.
            </p>
          </div>
          <div className="inline-flex p-1 rounded-full border border-rule-strong bg-white">
            {(["All", "Equity", "Hybrid"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`h-8 px-4 rounded-full text-[12px] font-medium transition inline-flex items-center gap-1.5 ${
                  filter === k ? "bg-primary text-white" : "text-muted hover:text-body"
                }`}
              >
                {k !== "All" && <span className="size-1.5 rounded-full" style={{ background: CATEGORY_COLOR[k] }} />}
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-rule rounded-[18px] p-5 relative shadow-card">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            {/* quadrant fills */}
            <rect x={PADL} y={PADT} width={xAt(xMid) - PADL} height={yAt(yMid) - PADT} fill="var(--color-positive)" opacity="0.04" />
            <rect x={xAt(xMid)} y={yAt(yMid)} width={W - PADR - xAt(xMid)} height={H - PADB - yAt(yMid)} fill="var(--color-negative)" opacity="0.04" />

            {/* gridlines */}
            {xTicks.map((t, i) => (
              <g key={`x${i}`}>
                <line x1={xAt(t)} x2={xAt(t)} y1={PADT} y2={H - PADB} stroke="var(--color-border)" strokeDasharray="2 4" />
                <text x={xAt(t)} y={H - PADB + 14} textAnchor="middle" style={{ fill: "var(--color-muted-foreground)", fontSize: 9, fontFamily: "var(--font-sans)" }}>
                  {t.toFixed(0)}%
                </text>
              </g>
            ))}
            {yTicks.map((t, i) => (
              <g key={`y${i}`}>
                <line x1={PADL} x2={W - PADR} y1={yAt(t)} y2={yAt(t)} stroke="var(--color-border)" strokeDasharray="2 4" />
                <text x={PADL - 8} y={yAt(t) + 3} textAnchor="end" style={{ fill: "var(--color-muted-foreground)", fontSize: 9, fontFamily: "var(--font-sans)" }}>
                  {t >= 0 ? "+" : ""}{t.toFixed(1)}%
                </text>
              </g>
            ))}

            {/* mid axes */}
            <line x1={xAt(xMid)} x2={xAt(xMid)} y1={PADT} y2={H - PADB} stroke="var(--color-border-strong)" />
            <line x1={PADL} x2={W - PADR} y1={yAt(yMid)} y2={yAt(yMid)} stroke="var(--color-border-strong)" />

            {/* quadrant labels */}
            <text x={PADL + 8} y={PADT + 14} textAnchor="start" style={{ fontSize: 9, fontFamily: "var(--font-sans)", letterSpacing: 1.2, fontWeight: 600, fill: "var(--color-positive)" }}>HIGH RETURN · LOW RISK</text>
            <text x={W - PADR - 8} y={PADT + 14} textAnchor="end" style={{ fontSize: 9, fontFamily: "var(--font-sans)", letterSpacing: 1.2, fontWeight: 600, fill: "var(--color-gold)" }}>HIGH RETURN · HIGH RISK</text>
            <text x={PADL + 8} y={H - PADB - 6} textAnchor="start" style={{ fontSize: 9, fontFamily: "var(--font-sans)", letterSpacing: 1.2, fontWeight: 600, fill: "var(--color-muted-foreground)" }}>LOW RETURN · LOW RISK</text>
            <text x={W - PADR - 8} y={H - PADB - 6} textAnchor="end" style={{ fontSize: 9, fontFamily: "var(--font-sans)", letterSpacing: 1.2, fontWeight: 600, fill: "var(--color-negative)" }}>LOW RETURN · HIGH RISK</text>

            {/* axis titles */}
            <text x={W / 2} y={H - 6} textAnchor="middle" style={{ fontSize: 10, fontFamily: "var(--font-sans)", letterSpacing: 1, fill: "var(--color-foreground)" }}>VOLATILITY (ANNUALISED)</text>
            <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} style={{ fontSize: 10, fontFamily: "var(--font-sans)", letterSpacing: 1, fill: "var(--color-foreground)" }}>SINCE INCEPTION RETURN</text>

            {/* bubbles */}
            {shown.map(({ f, x, y, r, c }) => {
              const active = hover === f.schemeCode;
              const color = CATEGORY_COLOR[c] ?? "var(--color-primary)";
              return (
                <g key={f.schemeCode} onMouseEnter={() => setHover(f.schemeCode)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                  <Link href={`/sifs/${f.schemeCode.toLowerCase()}`}>
                    <circle cx={xAt(x)} cy={yAt(y)} r={r} fill={color} opacity={active ? 0.5 : 0.28} />
                    <circle cx={xAt(x)} cy={yAt(y)} r={r} fill="none" stroke={color} strokeWidth={active ? 2 : 1.2} />
                    {active && (
                      <text x={xAt(x)} y={yAt(y) - r - 6} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: "var(--color-foreground)" }}>
                        {f.name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim().split(" ").slice(0, 3).join(" ")}
                      </text>
                    )}
                  </Link>
                </g>
              );
            })}
          </svg>

          {/* hover detail */}
          {hover && (() => {
            const d = shown.find((x) => x.f.schemeCode === hover);
            if (!d) return null;
            const { f, c } = d;
            const color = CATEGORY_COLOR[c] ?? "var(--color-primary)";
            return (
              <div className="absolute top-4 right-4 w-64 bg-white border border-rule rounded-[14px] p-4 shadow-premium">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>{c} · {f.strategy}</div>
                <div className="mt-1 text-[13px] font-semibold leading-tight text-heading">{f.name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim()}</div>
                <div className="text-[10px] text-muted mt-0.5">{f.amc}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                  <Cell label="SI Return" value={f.returns["SI"] !== null ? `${f.returns["SI"]! >= 0 ? "+" : ""}${f.returns["SI"]!.toFixed(2)}%` : "—"} tone={f.returns["SI"] !== null ? (f.returns["SI"]! >= 0 ? "pos" : "neg") : undefined} />
                  <Cell label="NAV" value={`₹${f.nav.toFixed(4)}`} />
                  <Cell label="Sharpe" value={f.sharpes["SI"] !== null ? f.sharpes["SI"]!.toFixed(2) : "—"} />
                  <Cell label="Max Drawdown" value={f.drawdowns["SI"] !== null ? `${f.drawdowns["SI"]!.toFixed(1)}%` : "—"} tone={f.drawdowns["SI"] !== null ? "neg" : undefined} />
                </div>
              </div>
            );
          })()}

          {/* legend */}
          <div className="mt-2 flex flex-wrap items-center gap-4 px-2 text-[10px] font-mono uppercase tracking-widest text-muted">
            <span>Bubble size = AUM (where available)</span>
            <span className="ml-auto flex items-center gap-3">
              {(["Equity", "Hybrid"] as const).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: CATEGORY_COLOR[c] }} /> {c}
                </span>
              ))}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-muted">Source: AMFI NAV data. Volatility annualised from NAV history. Returns calculated by SIFcase.</p>
      </div>
    </section>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted">{label}</div>
      <div className={`tabular font-medium text-body ${tone === "pos" ? "text-gain" : tone === "neg" ? "text-loss" : ""}`}>{value}</div>
    </div>
  );
}
