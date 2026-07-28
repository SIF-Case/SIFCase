"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Users, TrendingUp, BarChart2 } from "lucide-react";
import type { FundDetailsData } from "@/lib/sifData";

// recharts is the single biggest chunk on this page and both charts sit below
// the fold — load them only in the browser, once this section renders.
const chartFallback = () => <div className="h-[200px] rounded-lg bg-[#F4F6F8] animate-pulse" />;
const AssetAllocationChart = dynamic(
  () => import("./FundAllocationCharts").then((m) => m.AssetAllocationChart),
  { ssr: false, loading: chartFallback },
);
const IndustryChart = dynamic(
  () => import("./FundAllocationCharts").then((m) => m.IndustryChart),
  { ssr: false, loading: chartFallback },
);

// ─── Colour palette ────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#1E4ED8", "#0FAF75", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#EF4444", "#64748B",
  "#10B981", "#F97316",
];

// ─── Shared card wrapper ───────────────────────────────────────────────────────

function SectionCard({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">{label}</div>
        <h2 className="text-[24px] font-bold text-heading tracking-[-0.3px]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Key stats card ────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-4 border-b border-rule last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[13px] font-medium text-body tabular text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function fmtCr(n: number | null) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}

function fmtInr(n: number | null) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}



// ─── Voronoi treemap with overlay drill-down ──────────────────────────────────

const VORONOI_PALETTE: [string, string][] = [
  ["#D4956A","#B86030"], ["#AADD44","#78AA18"], ["#B090D0","#7050A8"],
  ["#7070D0","#4040A8"], ["#B0A0D8","#8060B0"], ["#A0B8C8","#608098"],
  ["#50A870","#287848"], ["#50A8A0","#287870"], ["#5090C0","#286898"],
  ["#3060B0","#183890"], ["#3880D0","#1858A8"], ["#70A0D8","#4878B0"],
  ["#80B0E0","#5888C0"], ["#40B8C8","#189098"], ["#E89060","#C05830"],
  ["#90D090","#58A858"], ["#D070A0","#A03870"], ["#A0D0D0","#68A0A0"],
  ["#D0B060","#A07830"], ["#8090D0","#5060A8"],
];

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + w.length + 1 > maxChars) { lines.push(cur); cur = w; }
    else { cur = cur ? `${cur} ${w}` : w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function polyArea(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  }
  return Math.abs(a / 2);
}

function polyCentroid(pts: [number, number][]): [number, number] {
  let x = 0, y = 0, a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const c = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    a += c; x += (pts[j][0] + pts[i][0]) * c; y += (pts[j][1] + pts[i][1]) * c;
  }
  a /= 2; x /= 6 * a; y /= 6 * a;
  return [x, y];
}

// Generate N monochromatic shades (light→dark) from a base hex colour
function monoShades(baseHex: string, n: number): [string, string][] {
  const r = parseInt(baseHex.slice(1,3),16);
  const g = parseInt(baseHex.slice(3,5),16);
  const b = parseInt(baseHex.slice(5,7),16);
  return Array.from({length: n}, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    // light (t=0) → dark (t=1): interpolate toward a 40% darker version
    const blend = (ch: number, dark: number) => Math.round(ch + (dark - ch) * t);
    const light = `#${blend(r, Math.max(0,r-80)).toString(16).padStart(2,"0")}${blend(g, Math.max(0,g-80)).toString(16).padStart(2,"0")}${blend(b, Math.max(0,b-80)).toString(16).padStart(2,"0")}`;
    const dark  = `#${Math.max(0,parseInt(light.slice(1,3),16)-30).toString(16).padStart(2,"0")}${Math.max(0,parseInt(light.slice(3,5),16)-30).toString(16).padStart(2,"0")}${Math.max(0,parseInt(light.slice(5,7),16)-30).toString(16).padStart(2,"0")}`;
    return [light, dark] as [string, string];
  });
}

interface VCell { name: string; pct: number; pts: string; polygon: [number,number][]; cx: number; cy: number; area: number; gradId: string }

function GradientDefs({ cells, palette }: { cells: VCell[]; palette: [string,string][] }) {
  return (
    <>
      {cells.map((c, i) => {
        const [lt, dk] = palette[i] ?? ["#aaa","#888"];
        return (
          <radialGradient key={c.gradId} id={c.gradId}
            cx={c.cx} cy={c.cy} r={Math.sqrt(c.area)*0.8}
            gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lt}/>
            <stop offset="100%" stopColor={dk}/>
          </radialGradient>
        );
      })}
    </>
  );
}

async function computeCells(
  items: {name: string; pct: number}[],
  clip: [number,number][],
  palette: [string, string][],
  prefix: string,
): Promise<VCell[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ hierarchy }, { voronoiTreemap }] = await Promise.all([import("d3-hierarchy") as any, import("d3-voronoi-treemap") as any]);
  const root = hierarchy({name:"root",children:items}).sum((d:any)=>d.pct??0);
  voronoiTreemap().clip(clip)(root);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return root.leaves().map((leaf:any, i:number) => {
    const poly: [number,number][] = leaf.polygon;
    const [cx,cy] = polyCentroid(poly);
    return { name: leaf.data.name, pct: leaf.data.pct, pts: poly.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" "), polygon: poly, cx, cy, area: polyArea(poly), gradId: `${prefix}-${i}` };
  });
}

function VoronoiLayer({
  cells, dim, onCellClick,
}: {
  cells: VCell[];
  dim?: boolean;
  onCellClick?: (name: string) => void;
}) {
  const [hovered, setHovered] = useState<string|null>(null);
  return (
    <g opacity={dim ? 0.18 : 1} style={{transition:"opacity 0.35s"}}>
      {cells.map(c => {
        const fs = Math.min(16, Math.max(8, Math.sqrt(c.area)/12));
        const lines = wrapText(c.name, Math.max(4, Math.floor(Math.sqrt(c.area)/(fs*0.56))));
        const lh = fs * 1.25;
        const totalH = (lines.length + 1) * lh;
        const isHov = hovered === c.name;
        return (
          <g key={c.name}
            onClick={() => !dim && onCellClick?.(c.name)}
            onMouseEnter={() => !dim && setHovered(c.name)}
            onMouseLeave={() => setHovered(null)}
            style={{cursor: !dim && onCellClick ? "pointer" : "default"}}>
            <polygon points={c.pts} fill={`url(#${c.gradId})`}
              stroke="white" strokeWidth={isHov ? 4 : 2.5}
              opacity={hovered && !isHov && !dim ? 0.65 : 1}
              style={{transition:"opacity 0.15s"}}/>
            {fs >= 9 && lines.map((line,j) => (
              <text key={j} x={c.cx} y={c.cy - totalH/2 + (j+0.9)*lh}
                textAnchor="middle" fill="white" fontSize={fs} fontWeight={700}
                style={{pointerEvents:"none"}}>{line}</text>
            ))}
            {fs >= 9 && (
              <text x={c.cx} y={c.cy + totalH/2 - lh*0.15}
                textAnchor="middle" fill="rgba(255,255,255,0.88)"
                fontSize={Math.max(8, fs*0.82)}
                style={{pointerEvents:"none"}}>
                {c.pct.toFixed(2)}%
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function VoronoiSectorChart({
  industries, holdings,
}: {
  industries: { industry: string; percentage: number }[];
  holdings: { name: string; percentage: number; sector?: string }[];
}) {
  const W = 960; const H = 660;
  const [sectorCells, setSectorCells] = useState<VCell[]>([]);
  const [holdingCells, setHoldingCells] = useState<VCell[]>([]);
  const [holdingPalette, setHoldingPalette] = useState<[string,string][]>([]);
  const [drillSector, setDrillSector] = useState<string|null>(null);
  const [initDone, setInitDone] = useState(false);
  const [drillComputing, setDrillComputing] = useState(false);
  const [popActive, setPopActive] = useState(false);

  const sectorItems = industries.filter(i=>i.percentage>0).sort((a,b)=>b.percentage-a.percentage).map(i=>({name:i.industry,pct:i.percentage}));
  const sectorPalette = sectorItems.map((_,i) => VORONOI_PALETTE[i % VORONOI_PALETTE.length]);

  // Compute sector Voronoi once on mount
  useEffect(() => {
    if (!sectorItems.length) return;
    const PX = 28; const PY = 52; // more top/bottom breathing room
    const fullClip: [number,number][] = [[PX,PY],[W-PX,PY],[W-PX,H-PY],[PX,H-PY]];
    computeCells(sectorItems, fullClip, sectorPalette, "s").then(cells => {
      setSectorCells(cells);
      setInitDone(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute holdings Voronoi when sector is drilled
  useEffect(() => {
    if (!drillSector) { setHoldingCells([]); setPopActive(false); return; }
    const holdItems = holdings.filter(h => {
      if (h.percentage<=0) return false;
      const s=(h.sector??"").toLowerCase(), d=drillSector.toLowerCase();
      return s===d||s.includes(d)||d.includes(s);
    }).sort((a,b)=>b.percentage-a.percentage).map(h=>({name:h.name,pct:h.percentage}));
    if (!holdItems.length) return;

    const sectorIdx = sectorItems.findIndex(s=>s.name===drillSector);
    const [baseLight] = VORONOI_PALETTE[Math.max(0,sectorIdx) % VORONOI_PALETTE.length];
    const shades = monoShades(baseLight, holdItems.length);
    setHoldingPalette(shades);
    setDrillComputing(true);
    // Clip holdings Voronoi to the parent sector's polygon shape
    const parentCell = sectorCells.find(c => c.name === drillSector);
    const clip: [number,number][] = parentCell ? parentCell.polygon : [[0,0],[W,0],[W,H],[0,H]];
    const safeKey = drillSector.replace(/[^a-zA-Z0-9]/g, "_");
    computeCells(holdItems, clip, shades, `hd_${safeKey}`).then(cells => {
      setPopActive(false);
      setHoldingCells(cells);
      setDrillComputing(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setPopActive(true)));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillSector]);

  const holdTotal = holdings.filter(h=>{
    if(h.percentage<=0||!drillSector) return false;
    const s=(h.sector??"").toLowerCase(),d=drillSector.toLowerCase();
    return s===d||s.includes(d)||d.includes(s);
  }).reduce((sum,h)=>sum+h.percentage,0);

  return (
    <div>


      {!initDone ? (
        <div className="flex items-center justify-center h-[660px]">
          <div className="text-[13px] text-muted animate-pulse">Computing layout…</div>
        </div>
      ) : (() => {
        // Centroid of clicked sector — used as scale origin
        const parentCell = drillSector ? sectorCells.find(c => c.name === drillSector) : null;
        const ox = parentCell?.cx ?? W / 2;
        const oy = parentCell?.cy ?? H / 2;
        const SCALE = 1.12;
        // SVG transform: scale around (ox, oy)
        const popTransform = `translate(${ox},${oy}) scale(${SCALE}) translate(${-ox},${-oy})`;

        return (
          <svg viewBox={`0 0 ${W} ${H}`}
            onClick={() => { if (drillSector) setDrillSector(null); }}
            style={{width:"100%", maxHeight:720, cursor: drillSector ? "pointer" : "default"}}>
            <defs>
              <filter id="voronoi-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="14" stdDeviation="22" floodColor="rgba(0,0,0,0.42)" />
              </filter>
              <GradientDefs cells={sectorCells} palette={sectorPalette} />
              <GradientDefs cells={holdingCells} palette={holdingPalette} />
            </defs>

            {/* Layer 1 — sectors: dimmed when drilled */}
            <VoronoiLayer cells={sectorCells}
              dim={!!drillSector} onCellClick={setDrillSector} />

            {/* Layer 2 — holdings: scale in place, elevated with shadow + halo */}
            {holdingCells.length > 0 && !drillComputing && (
              <g
                onClick={e => e.stopPropagation()}
                style={{
                  transform: popActive ? `scale(1.4)` : `scale(1)`,
                  transformOrigin: `${ox}px ${oy}px`,
                  transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  filter: popActive ? "url(#voronoi-shadow)" : "none",
                }}
              >
                {/* White halo ring rendered behind cells */}
                {holdingCells.map(c => (
                  <polygon key={`halo-${c.name}`} points={c.pts}
                    fill="none" stroke="white" strokeWidth={8}
                    strokeLinejoin="round" opacity={0.85} />
                ))}
                <VoronoiLayer cells={holdingCells} />
              </g>
            )}
          </svg>
        );
      })()}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function FundDetailsSection({ details }: { details: FundDetailsData }) {
  const [holdingSearch, setHoldingSearch] = useState("");
  const [showAllHoldings, setShowAllHoldings] = useState(false);

  const filteredHoldings = details.topHoldings.filter(h =>
    h.name.toLowerCase().includes(holdingSearch.toLowerCase()) ||
    (h.sector ?? "").toLowerCase().includes(holdingSearch.toLowerCase()),
  );

  // Collapse to top 10 unless expanded; searching always shows every match.
  const HOLDINGS_PREVIEW = 10;
  const isSearching = holdingSearch.trim().length > 0;
  const collapsed = !showAllHoldings && !isSearching;
  const visibleHoldings = collapsed ? filteredHoldings.slice(0, HOLDINGS_PREVIEW) : filteredHoldings;

  const longCount = details.topHoldings.filter(h => h.percentage > 0).length;
  const shortCount = details.topHoldings.filter(h => h.percentage < 0).length;

  return (
    <div className="space-y-12">

      {/* ── KEY FUND DETAILS ───────────────────────────────────────────── */}
      <SectionCard label="Fund Details" title="Key scheme information">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Financials */}
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-rule bg-surface flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted">AUM & Costs</span>
            </div>
            <div>
              {details.aumCurrent != null && <StatRow label="Month-End AUM" value={fmtCr(details.aumCurrent)} />}
              {details.aumAggregate != null && <StatRow label="Monthly AAUM" value={fmtCr(details.aumAggregate)} />}
              {details.minInvestment != null && <StatRow label="Minimum Investment" value={fmtInr(details.minInvestment)} />}
              {details.additionalInvestment != null && <StatRow label="Additional Investment" value={fmtInr(details.additionalInvestment)} />}
              {details.exitLoad && <StatRow label="Exit Load" value={details.exitLoad} />}
              {details.schemeType && <StatRow label="Scheme Type" value={details.schemeType} />}
            </div>
          </div>

          {/* Right: Benchmark & Risk */}
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-rule bg-surface flex items-center gap-2">
              <BarChart2 className="size-4 text-primary" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted">Benchmark & Risk</span>
            </div>
            <div>
              {details.benchmarkName && <StatRow label="Benchmark" value={details.benchmarkName} />}
              {details.benchmarkRiskBand != null && <StatRow label="Benchmark Risk" value={`Risk Band ${details.benchmarkRiskBand}`} />}
              {details.riskBand != null && <StatRow label="Fund Risk Band" value={`Risk Band ${details.riskBand}`} />}
              {details.benchmarkDetails && <StatRow label="Benchmark Details" value={details.benchmarkDetails} />}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── FUND MANAGERS ──────────────────────────────────────────────── */}
      {details.fundManagers?.length > 0 && (
        <SectionCard label="Management" title="Fund managers">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-rule bg-surface flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted">{details.fundManagers.length} manager{details.fundManagers.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-rule">
              {details.fundManagers.map((m, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3 border-b border-rule last:border-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-b-0">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold text-primary">
                      {m.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-heading">{m.name}</div>
                    <div className="text-[11px] text-muted mt-0.5">{m.designation || "Fund Manager"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── ASSET ALLOCATION ───────────────────────────────────────────── */}
      {details.assetAllocation?.length > 0 && (
        <SectionCard label="Portfolio" title="Asset allocation">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-rule bg-surface flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted">As per latest factsheet</span>
              <span className="text-[11px] text-muted">{details.assetAllocation.length} asset classes</span>
            </div>
            <div className="grid md:grid-cols-[1fr_260px] divide-y md:divide-y-0 md:divide-x divide-rule">
              <div className="p-6">
                <AssetAllocationChart data={details.assetAllocation} />
              </div>
              <div className="divide-y divide-rule">
                {details.assetAllocation.map((a, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: a.percentage < 0 ? "#DC2626" : PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[12px] text-body">{a.assetClass}</span>
                    </div>
                    <span className={`text-[13px] font-bold tabular ${a.percentage < 0 ? "text-loss" : "text-heading"}`}>
                      {a.percentage.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── PORTFOLIO BY INDUSTRY ──────────────────────────────────────── */}
      {details.portfolioByIndustry?.length > 0 && (
        <SectionCard label="Portfolio" title="Equity Sector allocation">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">

            {/* Voronoi — desktop only */}
            <div className="hidden md:block p-6 border-b border-rule">
              <VoronoiSectorChart
                industries={details.portfolioByIndustry}
                holdings={details.topHoldings ?? []}
              />
            </div>

            {/* Bar chart + table — mobile only */}
            <div className="md:hidden grid divide-y divide-rule">
              <div className="p-6 [&_svg]:outline-none [&_.recharts-wrapper]:outline-none [&_*:focus]:outline-none">
                <IndustryChart data={details.portfolioByIndustry} />
              </div>
              <div className="overflow-y-auto max-h-[480px]">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-surface border-b border-rule">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">Sector</th>
                      <th className="text-right px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {[...details.portfolioByIndustry]
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((row, i) => (
                        <tr key={i} className="hover:bg-surface transition-colors">
                          <td className="px-4 py-2.5 text-body">{row.industry}</td>
                          <td className="px-4 py-2.5 text-right tabular font-medium text-heading">{row.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── TOP HOLDINGS ───────────────────────────────────────────────── */}
      {details.topHoldings?.length > 0 && (
        <SectionCard label="Portfolio" title="Holdings">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-rule bg-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-[11px] text-muted">
                <span><span className="font-semibold text-gain">{longCount}</span> long positions</span>
                {shortCount > 0 && <span><span className="font-semibold text-loss">{shortCount}</span> short / futures</span>}
                <span>{details.topHoldings.length} total</span>
              </div>
              <div className="relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search holdings..."
                  value={holdingSearch}
                  onChange={e => setHoldingSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-[8px] border border-rule bg-white focus:outline-none focus:border-primary w-48"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-surface border-b border-rule">
                  <tr>
                    <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Instrument</th>
                    <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Sector</th>
                    <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Rating</th>
                    <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Market Value</th>
                    <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">1M Change</th>
                    <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">% of NAV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {visibleHoldings.map((h, i) => (
                    <tr key={i} className="hover:bg-surface transition-colors">
                      <td className="px-5 py-3 font-medium text-body">{h.name}</td>
                      <td className="px-4 py-3 text-muted">{h.sector || "—"}</td>
                      <td className="px-4 py-3">
                        {h.rating ? (
                          <span className="text-[10px] font-mono bg-surface border border-rule px-2 py-0.5 rounded-full text-muted">{h.rating}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-muted">{h.marketValue != null ? `₹${h.marketValue.toFixed(2)} Cr` : "—"}</td>
                      <td className={`px-4 py-3 text-right tabular ${h.change1M != null && h.change1M < 0 ? "text-loss" : h.change1M != null && h.change1M > 0 ? "text-gain" : "text-muted"}`}>
                        {h.change1M != null ? `${h.change1M >= 0 ? "+" : ""}${h.change1M.toFixed(2)}%` : "—"}
                      </td>
                      <td className={`px-5 py-3 text-right tabular font-bold ${h.percentage < 0 ? "text-loss" : "text-heading"}`}>
                        {h.percentage >= 0 ? "+" : ""}{h.percentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {filteredHoldings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted text-[13px]">No holdings match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isSearching && filteredHoldings.length > HOLDINGS_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllHoldings(v => !v)}
                className="w-full border-t border-rule px-5 py-3.5 text-left text-[12px] font-semibold text-primary hover:bg-surface transition-colors"
              >
                {showAllHoldings ? "Show less" : `See all ${filteredHoldings.length}`}
              </button>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── FUNDAMENTALS ──────────────────────────────────────────────── */}
      {details.fundamentals && (
        <SectionCard label="Portfolio" title="Fundamentals vs category">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-surface border-b border-rule">
                <tr>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Metric</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Fund</th>
                  <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Category Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {[
                  { label: "P/E", v: details.fundamentals.pe, avg: details.fundamentals.categoryAveragePe },
                  { label: "P/B", v: details.fundamentals.pb, avg: details.fundamentals.categoryAveragePb },
                  { label: "Price/Sales", v: details.fundamentals.priceToSale, avg: details.fundamentals.categoryAveragePriceToSale },
                  { label: "Price/Cash Flow", v: details.fundamentals.priceToCashFlow, avg: details.fundamentals.categoryAveragePriceToCashFlow },
                  { label: "Dividend Yield", v: details.fundamentals.dividendYield, avg: details.fundamentals.categoryAverageDividendYield, suffix: "%" },
                  { label: "ROE", v: details.fundamentals.roe, avg: details.fundamentals.categoryAverageRoe, suffix: "%" },
                ].filter(r => r.v != null).map((r, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-body">{r.label}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-heading">{r.v}{r.suffix ?? ""}</td>
                    <td className="px-5 py-3 text-right tabular text-muted">{r.avg != null ? `${r.avg}${r.suffix ?? ""}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── CONCENTRATION & MARKET CAP ───────────────────────────────────── */}
      {(details.concentration || details.marketCapWeightage) && (
        <SectionCard label="Portfolio" title="Concentration &amp; market cap">
          <div className="grid sm:grid-cols-2 gap-4">
            {details.concentration && (
              <div className="bg-white border border-rule rounded-[18px] shadow-card p-5">
                {details.concentration.numberOfHoldings != null && <StatRow label="Number of Holdings" value={String(details.concentration.numberOfHoldings)} />}
                {details.concentration.averageMarketCap && <StatRow label="Average Market Cap" value={details.concentration.averageMarketCap} />}
                {details.concentration.top3SectorWeight != null && <StatRow label="Top 3 Sector Weight" value={`${details.concentration.top3SectorWeight}%`} />}
                {details.concentration.top5StocksWeight != null && <StatRow label="Top 5 Stocks Weight" value={`${details.concentration.top5StocksWeight}%`} />}
                {details.concentration.top10StocksWeight != null && <StatRow label="Top 10 Stocks Weight" value={`${details.concentration.top10StocksWeight}%`} />}
              </div>
            )}
            {details.marketCapWeightage && (
              <div className="bg-white border border-rule rounded-[18px] shadow-card p-5">
                {[
                  { label: "Large Cap", v: details.marketCapWeightage.largeCap },
                  { label: "Mid Cap", v: details.marketCapWeightage.midCap },
                  { label: "Small Cap", v: details.marketCapWeightage.smallCap },
                  { label: "Others", v: details.marketCapWeightage.others },
                ].filter(r => r.v != null).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="text-[12px] text-muted w-[80px] shrink-0">{r.label}</span>
                    <div className="flex-1 h-[6px] bg-surface rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, r.v ?? 0))}%` }} />
                    </div>
                    <span className="text-[12px] font-bold tabular text-heading w-[48px] text-right">{r.v}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── ROLLING RETURNS ───────────────────────────────────────────────── */}
      {details.rollingReturns?.length > 0 && (
        <SectionCard label="Performance" title="Rolling returns">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-surface border-b border-rule">
                <tr>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Period</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Avg Return</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Min</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Max</th>
                  <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Positive %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {details.rollingReturns.map((r, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-medium text-body">{r.timeframe}</td>
                    <td className="px-4 py-3 text-right tabular font-bold text-heading">{r.averageReturn != null ? `${r.averageReturn.toFixed(2)}%` : "—"}</td>
                    <td className="px-4 py-3 text-right tabular text-loss">{r.minReturn != null ? `${r.minReturn.toFixed(2)}%` : "—"}</td>
                    <td className="px-4 py-3 text-right tabular text-gain">{r.maxReturn != null ? `${r.maxReturn.toFixed(2)}%` : "—"}</td>
                    <td className="px-5 py-3 text-right tabular text-muted">{r.positiveRatio != null ? `${r.positiveRatio.toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── PEERS ─────────────────────────────────────────────────────────── */}
      {details.peers?.length > 0 && (
        <SectionCard label="Comparison" title="Peer funds">
          <div className="bg-white border border-rule rounded-[18px] shadow-card overflow-hidden overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-surface border-b border-rule">
                <tr>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">Fund</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">AUM</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">P/E</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">P/B</th>
                  <th className="text-right px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">TER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {details.peers.map((p, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-medium text-body">{p.schemeNameShort || p.schemeName}</td>
                    <td className="px-4 py-3 text-right tabular text-muted">{p.aum || "—"}</td>
                    <td className="px-4 py-3 text-right tabular text-muted">{p.pe || "—"}</td>
                    <td className="px-4 py-3 text-right tabular text-muted">{p.pb || "—"}</td>
                    <td className="px-5 py-3 text-right tabular text-muted">{p.expenseRatio ? `${p.expenseRatio}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Suitability + market-scenario sections render on the scheme page
          (Performance column) — not duplicated here. */}

      {/* Factsheets intentionally omitted here — the scheme page renders them
          once under "Scheme documents". */}
    </div>
  );
}
