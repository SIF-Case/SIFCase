import type { FundRow, PeriodKey } from "@/lib/sifData";

const PERIOD_KEYS: PeriodKey[] = ["1M", "3M", "6M", "1Y", "SI"];

/** Rebase a series to a 100-point index of % growth from its first value. */
export function toCumulative(s: number[]) {
  const b = s[0];
  return s.map((v) => ((v - b) / b) * 100);
}

export interface CategoryAverage {
  category: string;
  fundCount: number;
  avgReturns: Record<PeriodKey, number | null>;
}

/** Average returns per period, grouped by each fund's strategy. */
export function getCategoryAverages(funds: FundRow[]): CategoryAverage[] {
  const groups = new Map<string, FundRow[]>();
  for (const f of funds) {
    const list = groups.get(f.strategy) ?? [];
    list.push(f);
    groups.set(f.strategy, list);
  }

  return Array.from(groups.entries())
    .map(([category, group]) => {
      const avgReturns = PERIOD_KEYS.reduce((acc, period) => {
        const values = group.map((f) => f.returns[period]).filter((v): v is number => v !== null);
        acc[period] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
        return acc;
      }, {} as Record<PeriodKey, number | null>);

      return { category, fundCount: group.length, avgReturns };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Average % growth curve across all funds in a strategy for the given period.
 * Each fund's sparkline is rebased to 100 at its start, then series are
 * right-aligned (matching CompareLab's chart-data alignment) and averaged
 * elementwise. Returns null if fewer than 2 funds have usable history.
 */
export function getCategoryAverageSeries(
  funds: FundRow[],
  strategy: string,
  period: PeriodKey,
): { data: number[]; dates: string[] } | null {
  const candidates = funds
    .filter((f) => f.strategy === strategy)
    .map((f) => ({
      cumulative: f.sparklines[period],
      dates: f.sparklineDates[period],
    }))
    .filter((c) => c.cumulative && c.cumulative.length >= 2)
    .map((c) => ({ data: toCumulative(c.cumulative), dates: c.dates }));

  if (candidates.length < 2) return null;

  const maxLen = Math.max(...candidates.map((c) => c.data.length));
  const longest = candidates.reduce((a, b) => (a.data.length >= b.data.length ? a : b));

  const data = Array.from({ length: maxLen }, (_, i) => {
    let sum = 0;
    let count = 0;
    for (const c of candidates) {
      const offset = maxLen - c.data.length;
      const si = i - offset;
      if (si >= 0) {
        sum += c.data[si];
        count += 1;
      }
    }
    return count ? sum / count : 0;
  });

  return { data, dates: longest.dates };
}
