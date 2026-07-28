"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

/**
 * The only recharts consumers on the fund page. Kept in their own module so
 * FundDetailsSection can pull them in with `ssr: false` — recharts is ~340 KB
 * of the fund page's initial JS, and these two bar charts sit far below the
 * fold. The surrounding tables stay server-rendered, so nothing indexable moves.
 */

const PIE_COLORS = [
  "#1E4ED8", "#0FAF75", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#EF4444", "#64748B",
  "#10B981", "#F97316",
];

function barColor(pct: number) {
  return pct < 0 ? "#DC2626" : "#1E4ED8";
}

export function AssetAllocationChart({ data }: { data: { assetClass: string; percentage: number }[] }) {
  const sorted = [...data].sort((a, b) => b.percentage - a.percentage);
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 36)} minWidth={0}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="assetClass" width={160} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}%`, "Allocation"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {sorted.map((entry, i) => <Cell key={i} fill={barColor(entry.percentage)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IndustryChart({ data }: { data: { industry: string; percentage: number }[] }) {
  const sorted = [...data].sort((a, b) => b.percentage - a.percentage).slice(0, 20);
  return (
    <ResponsiveContainer width="100%" height={sorted.length * 36 + 32} minWidth={0}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 44, top: 4, bottom: 4 }}
        tabIndex={-1} style={{ outline: "none", userSelect: "none" }}>
        <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="industry" width={115}
          axisLine={false} tickLine={false}
          tick={(props) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { x, y, payload } = props as any;
            const label = payload.value.length > 12 ? payload.value.slice(0, 11) + "…" : payload.value;
            return (
              <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" fill="#334155" fontSize={11}>
                {label}
              </text>
            );
          }} />
        <Tooltip
          cursor={false}
          formatter={(v) => [`${Number(v).toFixed(2)}%`, "Allocation"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
        <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={18} activeBar={false}>
          {sorted.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          <LabelList dataKey="percentage" position="right"
            formatter={(v) => `${Number(v).toFixed(1)}%`}
            style={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
