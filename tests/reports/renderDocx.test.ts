import assert from "node:assert/strict";
import PizZip from "pizzip";
import { renderReport } from "@/lib/reports/renderDocx";
import type { ReportModel } from "@/lib/reports/types";

const model: ReportModel = {
  monthLabel: "June 2026", monthShort: "Jun 2026", asOfLong: "30th Jun 2026", asOfShort: "Jun 30, 2026", year: 2026,
  monthUpper: "JUNE 2026", snapshotAum: "17,858", snapshotNetFlow: "3,782", nsrMobilised: "1,740.00",
  universe: {
    monthLabel: "June 2026",
    categories: [
      { key: "equity_ls", label: "Equity Long-Short", schemes: 9, aumCr: "2,225.36", folios: "14,841", grossInflowCr: "433.94", netFlowCr: "+333.20" },
    ],
    grandTotal: { key: "grand_total", label: "Grand Total", schemes: 27, aumCr: "17,857.77", folios: "75,032", grossInflowCr: "4,166.94", netFlowCr: "+3,781.96" },
    nsr: { rows: [{ category: "Equity Long-Short", schemeNames: "iSIF Equity Long-Short Fund", count: 1, mobilisedCr: "212" }], totalSchemes: 6, totalMobilisedCr: 1740 },
  },
  perf: {
    equity: [{ schemeName: "qsif Equity Long Short Fund", shortCategory: "Equity L-S", amc: "qsif SIF", r1m: "+2.43%", r3m: "+18.57%", r6m: "+5.31%", r1y: "-", si: "+5.07%", since: "Oct-25" }],
    hybrid: [], debt: [], comprehensive: [], top3: [], bottom3: [], totals: { schemes: 27, positive: 20, negative: 1 },
  },
  prose: { universeOverview: "As of June 2026, the SIF universe comprised 27 active schemes…", debtSectionNote: "No Debt Long-Short SIF schemes have been launched as of June 2026.", highlightsIntro: "All returns computed from NAV history." },
};

const buf = renderReport(model);
const text = new PizZip(buf).file("word/document.xml")!.asText();
assert.ok(text.includes("27"));                       // snapshot number rendered
assert.ok(text.includes("Equity Long-Short"));        // category row rendered
assert.ok(text.includes("comprised 27 active schemes"));
// fixed regulatory text survived untouched:
assert.ok(text.includes("Minimum investment in equity and equity related instruments"));
assert.ok(text.includes("SEBI Mandatory Standard Disclaimer"));
// no leftover unfilled tags:
assert.ok(!/\{[#\/]?(universe|perf|prose|monthLabel|monthShort|asOf)/.test(text));
console.log("OK renderDocx");
