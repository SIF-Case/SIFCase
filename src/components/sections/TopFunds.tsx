"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, ArrowRight, Bookmark } from "lucide-react";
import type { FundRow, PeriodKey } from "@/lib/sifData";
import { SEBIRiskometer } from "@/components/ui/RiskMeter";
import { useWatchlist, rememberPendingWatchlistAdd } from "@/hooks/useWatchlist";
import { AuthModal } from "@/components/auth/AuthModal";
import { trackActivity } from "@/components/UserTracker";

const FILTERS = ["All", "Hybrid", "Equity"] as const;
type Filter = (typeof FILTERS)[number];

const PERIODS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];

function Sparkline({ data, dates, id }: { data: number[]; dates: string[]; id: string }) {
  const W = 200, H = 56, PAD = 4;
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const fracX = (rawX - PAD) / (W - PAD * 2);
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(fracX * (data.length - 1))));
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 0.01;
    const px = PAD + (idx / (data.length - 1)) * (W - PAD * 2);
    const py = H - PAD - ((data[idx] - min) / range) * (H - PAD * 2);
    setTooltip({ x: px, y: py, idx });
  }, [data]);

  if (data.length < 2) return <div style={{ height: H }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;
  const trending = data[data.length - 1] >= data[0];
  const color = trending ? "#00b370" : "#f00013";
  const pts = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx} ${prev.y.toFixed(1)}, ${cpx} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;
  const gradId = `spark-${id}`;
  const last = pts[pts.length - 1];

  const tip = tooltip !== null ? tooltip : null;
  const tipDate = tip ? (dates[tip.idx] ?? "") : "";
  const tipNav = tip ? data[tip.idx] : 0;
  const tipAnchorRight = tip && tip.x > W * 0.6;

  return (
    <div className="relative" style={{ borderRadius: 8, background: "#f0f0f0", overflow: "hidden" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible cursor-crosshair"
        height={H}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="3" fill={color} />

        {tip && (
          <>
            <line x1={tip.x} y1={PAD} x2={tip.x} y2={H} stroke={color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.5" />
            <circle cx={tip.x} cy={tip.y} r="4" fill="white" stroke={color} strokeWidth="1.8" />
          </>
        )}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 text-white text-[10px] font-semibold rounded-md px-2 py-1 leading-snug shadow-lg whitespace-nowrap"
          style={{
            background: "#0d2b3e",
            bottom: `${H - tip.y + 10}px`,
            ...(tipAnchorRight
              ? { right: `${(1 - tip.x / W) * 100}%` }
              : { left: `${(tip.x / W) * 100}%` }),
            transform: tipAnchorRight ? "translateX(0)" : "translateX(-50%)",
          }}
        >
          <p className="nums">₹{tipNav.toFixed(4)}</p>
          <p className="text-[9px] font-normal opacity-75">{tipDate}</p>
        </div>
      )}
    </div>
  );
}

function FundCard({ fund, period, onRequireAuth }: { fund: FundRow; period: PeriodKey; onRequireAuth: (reason: string) => void }) {
  const periodRet = fund.returns?.[period] ?? null;
  const { watching, toggle, loading, loggedIn } = useWatchlist(fund.schemeCode);

  function handleWatchClick() {
    if (!loggedIn) {
      rememberPendingWatchlistAdd(fund.schemeCode);
      onRequireAuth("save to your watchlist");
      return;
    }
    toggle();
  }

  function handleInvestClick(e: React.MouseEvent) {
    if (!loggedIn) {
      e.preventDefault();
      onRequireAuth("invest in this fund");
      return;
    }
    e.preventDefault();
    trackActivity("Invest", `Expressed interest in investing in: ${fund.fundName || fund.name}`);
    alert(`Thank you for your interest in ${fund.fundName || fund.name}. We have recorded your interest, and our advisory team will contact you shortly.`);
  }

  const fmtRet = (v: number | null | undefined) =>
    v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "—";
  const retColor = (v: number | null | undefined) =>
    v != null ? (v >= 0 ? "#00b370" : "#f00013") : "#90a5ba";

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        padding: "16px 18px",
        borderRadius: 16,
        background: "#fff",
        boxShadow: "0 1px 16px 0 rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Header: fund name + NAV/AUM */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <div>
            <p
              style={{
                color: "#000",
                fontSize: 13,
                fontWeight: 700,
                lineHeight: "normal",
                letterSpacing: "0.3px",
              }}
            >
              {fund.fundName || fund.name}
            </p>
            <p style={{ color: "#000", fontSize: 10, fontWeight: 500, lineHeight: "12px", letterSpacing: "0.3px", marginTop: 4 }}>
              {fund.companyName}
            </p>
          </div>
          {/* Stats row */}
          <div className="flex items-center gap-3">
            {[
              { label: `${period} RETURN`, value: fmtRet(periodRet), color: retColor(periodRet) },
              {
                label: "SHARPE",
                value: fund.sharpes?.[period] != null ? fund.sharpes[period]!.toFixed(2) : "—",
                color: (fund.sharpes?.[period] ?? 0) >= 1 ? "#00b370" : (fund.sharpes?.[period] ?? 0) >= 0 ? "#f59e0b" : "#f00013",
              },
              {
                label: "DRAWDOWN",
                value: fund.drawdowns?.[period] != null ? `${fund.drawdowns[period]!.toFixed(2)}%` : "—",
                color: "#f00013",
              },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span style={{ color: "#90a5ba", fontSize: 8, fontWeight: 500, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
                <span
                  className="nums"
                  style={{ color: s.color, fontSize: 12, fontWeight: 500, letterSpacing: "0.3px" }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* NAV / AUM */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0" style={{ minWidth: 78 }}>
          <span style={{ color: "#90a5ba", fontSize: 8, fontWeight: 500, letterSpacing: "0.3px" }}>NAV</span>
          <span className="nums" style={{ color: "#000", fontSize: 11, fontWeight: 700, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
            ₹ {fund.nav.toFixed(4)}
          </span>
          <span style={{ color: "#90a5ba", fontSize: 8, fontWeight: 500, letterSpacing: "0.3px" }}>AUM</span>
          <span className="nums" style={{ color: "#000", fontSize: 11, fontWeight: 700, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
            {fund.aum != null ? `₹ ${fund.aum.toFixed(0)} Cr` : "—"}
          </span>
        </div>
      </div>

      {/* Sparkline chart */}
      <div className="min-w-0">
        <Sparkline data={fund.sparklines?.[period] ?? []} dates={fund.sparklineDates?.[period] ?? []} id={`${fund.schemeCode}-${period}`} />
      </div>

      {/* Risk meter */}
      {fund.riskBand != null && <SEBIRiskometer level={fund.riskBand} size="sm" />}

      {/* Actions */}
      <div className="flex items-center gap-[7px] pt-1">
        <a
          href={`/sifs/${fund.schemeCode.toLowerCase()}`}
          className="flex-1 text-center text-[14px] font-[500] transition-opacity hover:opacity-80"
          style={{
            padding: "8px 12px",
            borderRadius: 24,
            border: "1px solid #ececec",
            color: "#004c61",
            textDecoration: "none",
          }}
        >
          Details
        </a>
        <button
          type="button"
          onClick={handleWatchClick}
          disabled={loading}
          aria-label={watching ? "Remove from watchlist" : "Add to watchlist"}
          aria-pressed={watching}
          className="flex-shrink-0 flex items-center justify-center disabled:opacity-50"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: watching ? "1px solid #14b7a3" : "1px solid #ececec",
            background: watching ? "rgba(20,183,163,0.08)" : "transparent",
          }}
        >
          <Bookmark
            className="w-4 h-4"
            strokeWidth={2}
            fill={watching ? "#14b7a3" : "none"}
            color={watching ? "#14b7a3" : "#000"}
          />
        </button>
        <a
          href="#"
          onClick={handleInvestClick}
          className="flex-1 text-center text-white text-[14px] font-[500] transition-opacity hover:opacity-90"
          style={{
            padding: "8px 20px",
            borderRadius: 24,
            background: "#3b8bb1",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Invest Now
        </a>
      </div>
    </div>
  );
}

export function TopFunds({ funds }: { funds: FundRow[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [amc, setAmc] = useState<string>("All");
  const [amcOpen, setAmcOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState("");

  function requireAuth(reason: string) {
    setAuthReason(reason);
    setAuthOpen(true);
  }

  const amcs = ["All", ...Array.from(new Set(funds.map((f) => f.amc))).sort()];

  useEffect(() => {
    if (!amcOpen) return;
    const close = () => setAmcOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [amcOpen]);

  useEffect(() => { setVisibleCount(6); }, [filter, amc, period]);

  const filtered = funds
    .filter((f) => {
      if (filter !== "All" && f.category !== filter) return false;
      if (amc !== "All" && f.amc !== amc) return false;
      return true;
    })
    .sort((a, b) => {
      const ra = a.returns[period] ?? -Infinity;
      const rb = b.returns[period] ?? -Infinity;
      return rb - ra;
    });
  const visible = filtered.slice(0, visibleCount);

  return (
    <section style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 py-[84px]">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <p style={{ color: "#000", fontSize: 15, fontWeight: 400, lineHeight: "15px", marginBottom: 12 }}>
              LEADERBOARD
            </p>
            <h2
              style={{
                color: "#000",
                fontSize: 24,
                fontWeight: 700,
                lineHeight: "24px",
                textTransform: "capitalize",
                fontFamily: "'Satoshi Variable', sans-serif",
              }}
            >
              Best Performing SIFs
            </h2>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period pills */}
            <div
              className="flex items-center gap-1"
              style={{ padding: 4, borderRadius: 24, border: "1px solid #8a99ad" }}
            >
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 27,
                    borderRadius: 24,
                    border: period === p ? "1px solid rgba(110,208,255,0.2)" : "none",
                    background: period === p ? "#3b8bb1" : "transparent",
                    color: period === p ? "#fff" : "#8a99ad",
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* AMC dropdown */}
            <div className="relative">
              <button
                onClick={() => setAmcOpen((o) => !o)}
                className="flex items-center gap-2"
                style={{
                  padding: "9px 15px",
                  borderRadius: 24,
                  border: "1px solid #8a99ad",
                  background: "transparent",
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#4b5563",
                  cursor: "pointer",
                }}
              >
                {amc === "All" ? "All AMCs" : amc}
                <ChevronDown className={`w-3 h-3 transition-transform ${amcOpen ? "rotate-180" : ""}`} strokeWidth={2} />
              </button>
              {amcOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-20 py-1 overflow-y-auto"
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 14px 40px rgba(11,31,58,0.10)",
                    minWidth: 180,
                    maxHeight: 220,
                  }}
                >
                  {amcs.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAmc(a); setAmcOpen(false); }}
                      className="w-full text-left"
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        color: amc === a ? "#14b7a3" : "#374151",
                        fontWeight: amc === a ? 600 : 400,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fund type pills */}
            <div
              className="flex items-center gap-1.5"
              style={{ padding: 4, borderRadius: 24, border: "1px solid #8a99ad" }}
            >
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 11px 5px",
                    borderRadius: 24,
                    border: filter === f ? "1px solid #4599c1" : "none",
                    background: filter === f ? "#3b8bb1" : "transparent",
                    color: filter === f ? "#fff" : "#4b5563",
                    fontFamily: "inherit",
                    fontSize: filter === f ? 10 : 11,
                    fontWeight: filter === f ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fund cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[33px]">
          {visible.map((fund) => (
            <FundCard key={fund.schemeCode} fund={fund} period={period} onRequireAuth={requireAuth} />
          ))}
          {visible.length === 0 && (
            <p className="col-span-3 text-center py-12" style={{ color: "#64748B" }}>
              No funds in this category.
            </p>
          )}
        </div>

        {/* Load more / View all */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="inline-flex items-center gap-2 text-white text-[13.5px] font-semibold"
              style={{
                padding: "10px 24px",
                borderRadius: 24,
                background: "#14b7a3",
                border: "none",
                cursor: "pointer",
              }}
            >
              View More ({filtered.length - visibleCount} remaining)
            </button>
          )}
          <a
            href="/sifs"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold"
            style={{
              padding: "10px 24px",
              borderRadius: 24,
              border: "1px solid #ececec",
              color: "#0d2b3e",
              textDecoration: "none",
            }}
          >
            View all SIFs
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} reason={authReason} />
    </section>
  );
}
