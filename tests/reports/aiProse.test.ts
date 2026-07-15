import assert from "node:assert/strict";
import { fallbackProse } from "@/lib/reports/aiProse";
import type { UniverseData, PerformanceData } from "@/lib/reports/types";

const universe = {
  monthLabel: "June 2026",
  categories: [], grandTotal: { key: "grand_total", label: "Grand Total", schemes: 27, aumCr: 17857.77, folios: 75032, grossInflowCr: 4166.94, netFlowCr: 3781.96 },
  nsr: { rows: [], totalSchemes: 6, totalMobilisedCr: 1740 },
} as unknown as UniverseData;
const perf = { equity: [], hybrid: [], debt: [], comprehensive: [], top3: [], bottom3: [], totals: { schemes: 27, positive: 20, negative: 1 } } as PerformanceData;

const p = fallbackProse("June 2026", universe, perf);
assert.match(p.universeOverview, /27 active schemes/);
assert.match(p.universeOverview, /17,857.77/);
assert.match(p.debtSectionNote, /June 2026/);
assert.ok(p.highlightsIntro.length > 0);
console.log("OK aiProse fallback");
