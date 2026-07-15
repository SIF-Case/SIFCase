import { monthMetaFromDate } from "./monthMeta";
import { fetchUniverse } from "./amfiUniverse";
import { computeReportPerformance } from "./navPerformance";
import { generateProse } from "./aiProse";
import type {
  ReportModel,
  PerfRow,
  PerfRowDisplay,
  PerformanceDisplay,
  UniverseCategory,
  UniverseCategoryDisplay,
  UniverseDisplay,
  NsrScheme,
  NsrSchemeDisplay,
} from "./types";

function pct(v: number | null): string {
  if (v === null) return "-";
  const s = v >= 0 ? "+" : "";
  return `${s}${v.toFixed(2)}%`;
}

// Convert numeric PerfRow returns to display strings the template prints verbatim.
function fmtRows(rows: PerfRow[]): PerfRowDisplay[] {
  return rows.map((r) => ({
    schemeName: r.schemeName, shortCategory: r.shortCategory, amc: r.amc, since: r.since ?? "—",
    r1m: pct(r.r1m), r3m: pct(r.r3m), r6m: pct(r.r6m), r1y: pct(r.r1y), si: pct(r.si),
  }));
}

function commaInt(n: number): string {
  return n.toLocaleString("en-IN");
}

function comma2dp(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function signedComma2dp(n: number): string {
  return (n >= 0 ? "+" : "") + comma2dp(n);
}

// Pre-format universe numbers for display (commas + 2dp). `schemes` stays numeric.
function fmtCat(c: UniverseCategory): UniverseCategoryDisplay {
  return {
    key: c.key,
    label: c.label,
    schemes: c.schemes,
    aumCr: comma2dp(c.aumCr),
    folios: commaInt(c.folios),
    grossInflowCr: comma2dp(c.grossInflowCr),
    netFlowCr: signedComma2dp(c.netFlowCr),
  };
}

function fmtNsrRow(r: NsrScheme): NsrSchemeDisplay {
  return { category: r.category, schemeNames: r.schemeNames, count: r.count, mobilisedCr: commaInt(r.mobilisedCr) };
}

export async function buildReportModel(toDate: string): Promise<ReportModel> {
  const meta = monthMetaFromDate(toDate);
  const [universe, perfRaw] = await Promise.all([fetchUniverse(toDate), computeReportPerformance(toDate)]);
  const prose = await generateProse(meta.monthLabel, universe, perfRaw);

  const perf: PerformanceDisplay = {
    equity: fmtRows(perfRaw.equity), hybrid: fmtRows(perfRaw.hybrid), debt: fmtRows(perfRaw.debt),
    comprehensive: fmtRows(perfRaw.comprehensive), top3: fmtRows(perfRaw.top3), bottom3: fmtRows(perfRaw.bottom3),
    totals: perfRaw.totals,
  };

  // Compute snapshot/nsr summary tags from the NUMERIC values BEFORE the
  // universe's own numbers get stringified below.
  const snapshotAum = Math.round(universe.grandTotal.aumCr).toLocaleString("en-IN");
  const snapshotNetFlow = Math.round(universe.grandTotal.netFlowCr).toLocaleString("en-IN");
  const nsrMobilised = comma2dp(universe.nsr.totalMobilisedCr);

  const universeFmt: UniverseDisplay = {
    monthLabel: universe.monthLabel,
    categories: universe.categories.map(fmtCat),
    grandTotal: fmtCat(universe.grandTotal),
    nsr: {
      rows: universe.nsr.rows.map(fmtNsrRow),
      totalSchemes: universe.nsr.totalSchemes,
      totalMobilisedCr: universe.nsr.totalMobilisedCr,
    },
  };

  return {
    monthLabel: meta.monthLabel,
    monthShort: meta.monthShort,
    asOfLong: meta.asOfLong,
    asOfShort: meta.asOfShort,
    year: meta.year,
    monthUpper: meta.monthLabel.toUpperCase(),
    snapshotAum,
    snapshotNetFlow,
    nsrMobilised,
    universe: universeFmt,
    perf,
    prose,
  };
}

export function reportFileName(toDate: string): string {
  const meta = monthMetaFromDate(toDate);
  return `SIF_Monthly_Report_${meta.fileMon}${meta.year}.docx`;
}
