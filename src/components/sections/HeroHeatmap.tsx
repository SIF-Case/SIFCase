import React from "react";

const MONTHS = ["NOV '25", "DEC '25", "JAN '26", "FEB '26", "MAR '26", "APR '26", "MAY '26"];

const GROUPS = [
  {
    category: "HYBRID",
    funds: [
      { name: "Altiva Hybrid",        strategy: "Long-Short",         returns: [0.42, 0.02, 0.62, 1.81, 1.41, -0.94, -2.25] },
      { name: "Edelweiss Multi-Asset", strategy: "SIF",               returns: [null, null, -1.51, -0.53, 0.80, 0.78, 0.31] },
    ],
  },
  {
    category: "EQUITY",
    funds: [
      { name: "qsif Ex",           strategy: "Top 100 Long-Short",  returns: [2.67, 0.04, -1.49, -0.58, 0.72, 0.70, 0.26] },
      { name: "Nuvama Market",     strategy: "Neutral SIF",          returns: [null, null, null, null, 3.44, -3.50, -5.74] },
      { name: "IIFL Event-Driven", strategy: "Opportunities SIF",   returns: [1.63, 0.77, -1.19, -1.37, 1.37, 3.85, 2.29] },
      { name: "Motilal Oswal",     strategy: "Quant Alpha SIF",     returns: [null, 0.37, 0.84, 0.21, -1.24, -1.14, 1.31] },
    ],
  },
];

function intensity(abs: number): number {
  if (abs < 0.3) return 0.13;
  if (abs < 0.6) return 0.24;
  if (abs < 1.0) return 0.38;
  if (abs < 1.8) return 0.52;
  if (abs < 3.0) return 0.70;
  if (abs < 4.5) return 0.85;
  return 1.0;
}

function cellBg(v: number | null): string {
  if (v === null) return "transparent";
  const a = intensity(Math.abs(v));
  return v > 0 ? `rgba(15,175,117,${a})` : `rgba(220,38,38,${a})`;
}

function cellText(v: number | null): string {
  if (v === null) return "#CBD5E1";
  const a = intensity(Math.abs(v));
  if (a >= 0.65) return "white";
  return v > 0 ? "#0a7a50" : "#991b1b";
}

export function HeroHeatmap() {
  return (
    <div className="bg-white rounded-[14px] border border-rule shadow-premium overflow-hidden text-[11px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule bg-surface">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          Performance&nbsp;&nbsp;·&nbsp;&nbsp;Monthly Returns
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-faint bg-mist px-2 py-0.5 rounded-full">
          Sample data
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 420 }}>
          <thead>
            <tr className="border-b border-rule">
              <th className="text-left px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-faint w-[130px]">
                Fund
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="px-1 py-2 text-center"
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: m === "MAY '26" ? "#1E4ED8" : "#94A3B8",
                    width: 44,
                  }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <React.Fragment key={group.category}>
                {/* Category row */}
                <tr key={group.category} className="border-b border-rule-soft">
                  <td colSpan={8} className="px-3 pt-2.5 pb-1">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-navy inline-block" />
                      {group.category}
                    </span>
                  </td>
                </tr>

                {group.funds.map((fund, fi) => (
                  <tr
                    key={fund.name}
                    className={fi < group.funds.length - 1 ? "border-b border-rule-soft" : ""}
                  >
                    <td className="px-3 py-2 align-middle">
                      <p className="text-[11px] font-semibold text-heading leading-tight">{fund.name}</p>
                      <p className="text-[9.5px] text-faint font-mono mt-0.5">{fund.strategy}</p>
                    </td>
                    {fund.returns.map((v, mi) => (
                      <td key={mi} className="px-1 py-1.5 text-center align-middle">
                        <span
                          className="inline-flex items-center justify-center rounded-[5px] nums"
                          style={{
                            width: 38,
                            height: 26,
                            backgroundColor: cellBg(v),
                            color: cellText(v),
                            fontSize: 10,
                            fontWeight: 600,
                            border: v === null ? "1px solid #E5EDF5" : "none",
                          }}
                        >
                          {v === null ? "–" : (v > 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-rule bg-surface">
        <span className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-faint">
          Color intensity = magnitude of monthly return
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[8.5px] font-semibold text-faint mr-1">LOSS</span>
          {[0.9, 0.55, 0.2, 0.2, 0.55, 0.9].map((a, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full inline-block"
              style={{
                backgroundColor:
                  i < 3
                    ? `rgba(220,38,38,${a})`
                    : `rgba(15,175,117,${a})`,
              }}
            />
          ))}
          <span className="text-[8.5px] font-semibold text-faint ml-1">GAIN</span>
        </div>
      </div>
    </div>
  );
}
