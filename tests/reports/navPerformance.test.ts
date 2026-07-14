import assert from "node:assert/strict";
import { shortCategoryOf, computeReportPerformance } from "@/lib/reports/navPerformance";

// pure mapping
assert.equal(shortCategoryOf("Equity Long-Short"), "Equity L-S");
assert.equal(shortCategoryOf("Equity Ex-Top 100 Long-Short"), "Ex-100 L-S");
assert.equal(shortCategoryOf("Active Asset Allocator Long-Short"), "AAA L-S");
assert.equal(shortCategoryOf("Hybrid Long-Short"), "Hybrid L-S");
assert.equal(shortCategoryOf("Sector Rotation Long-Short"), "Sector R L-S");

(async () => {
  const perf = await computeReportPerformance("2026-06-30");
  // grouping is internally consistent
  assert.equal(perf.comprehensive.length, perf.equity.length + perf.hybrid.length + perf.debt.length);
  assert.equal(perf.top3.length <= 3, true);
  assert.equal(perf.totals.schemes, perf.comprehensive.length);
  // comprehensive is alphabetical by scheme name
  const names = perf.comprehensive.map((r) => r.schemeName);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  console.log("OK navPerformance");
})().catch((e) => { console.error(e); process.exit(1); });
