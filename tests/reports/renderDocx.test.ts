import assert from "node:assert/strict";
import PizZip from "pizzip";
import { renderReport } from "@/lib/reports/renderDocx";
import type { ReportModel } from "@/lib/reports/types";

const model: ReportModel = {
  monthLabel: "June 2026", monthShort: "Jun 2026", asOfLong: "30th Jun 2026", asOfShort: "Jun 30, 2026", year: 2026,
  monthUpper: "JUNE 2026", snapshotAum: "17,858", snapshotNetFlow: "3,782", nsrMobilised: "1,740.00",
  reportMonthShort: "Jul 2026",
  aumFootnote: null,
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
// scalar tags added beyond the stale brief must actually render:
assert.ok(text.includes("JUNE 2026"), "monthUpper");
assert.ok(text.includes("17,858"), "snapshotAum");
assert.ok(text.includes("3,782"), "snapshotNetFlow");
assert.ok(text.includes("1,740.00"), "nsrMobilised");
// fixed regulatory text survived untouched:
assert.ok(text.includes("Minimum investment in equity and equity related instruments"));
assert.ok(text.includes("SEBI Mandatory Standard Disclaimer"));
// per-value percent colouring applied — strong (>+3%) vs positive (0..+3%) distinguished:
assert.ok(text.includes('w:val="1A6E3A"'), "strong dark green (+18.57%/+5.31%/+5.07%)");
assert.ok(text.includes('w:val="27AE60"'), "positive green (+2.43%)");
// no leftover unfilled tags:
assert.ok(!/\{[#\/]?(universe|perf|prose|monthLabel|monthShort|asOf)/.test(text));
// running header is rendered from the model, and tracks the REPORT month even
// when the AMFI figures (monthShort) come from an earlier month:
const header = new PizZip(buf).file("word/header1.xml")!.asText();
assert.ok(header.includes("Jul 2026"), "header shows the report month");
assert.ok(!header.includes("Jun 2026"), "no hardcoded month left in the header");
assert.ok(!header.includes("{reportMonthShort}"), "header tag was filled");

// no footnote paragraph when the month's own AMFI data was used:
assert.ok(!text.includes("AMFI SIF report for"), "no stale-data note on a normal month");

// stale-data note lands on the cover, i.e. before the first page break:
const note = "*AUM figures are as per the AMFI SIF report for May 2026.";
const staleText = new PizZip(renderReport({ ...model, aumFootnote: note }))
  .file("word/document.xml")!.asText();
const noteAt = staleText.indexOf(note);
assert.ok(noteAt > -1, "footnote rendered");
assert.ok(noteAt < staleText.indexOf('w:type="page"'), "footnote sits on the cover page");
assert.ok(staleText.slice(noteAt - 400, noteAt).includes('w:sz w:val="14"'), "footnote is 7pt");

console.log("OK renderDocx");
