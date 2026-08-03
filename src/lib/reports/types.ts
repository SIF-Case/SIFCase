export type CategoryKey =
  | "equity_ls" | "equity_ex100_ls" | "sector_rotation_ls"
  | "debt_ls" | "aaa_ls" | "hybrid_ls";

export interface UniverseCategory {
  key: CategoryKey | "grand_total";
  label: string;         // "Equity Long-Short"
  schemes: number;
  aumCr: number;         // Net AUM (INR crore)
  folios: number;
  grossInflowCr: number; // Funds mobilized
  netFlowCr: number;     // Net inflow (+ve)/outflow (-ve)
}

export interface NsrScheme {
  category: string;      // "Equity Ex-Top 100 L-S"
  schemeNames: string;   // comma-joined
  count: number;
  mobilisedCr: number;
}

export interface UniverseData {
  monthLabel: string;
  categories: UniverseCategory[]; // 6 rows, report order
  grandTotal: UniverseCategory;
  nsr: { rows: NsrScheme[]; totalSchemes: number; totalMobilisedCr: number };
}

export interface PerfRow {
  schemeName: string;
  category: string;       // full strategy
  shortCategory: string;  // "Equity L-S"
  amc: string;
  r1m: number | null; r3m: number | null; r6m: number | null;
  r1y: number | null; si: number | null;
  since: string | null;   // "May-26"
}

export interface PerformanceData {
  equity: PerfRow[]; hybrid: PerfRow[]; debt: PerfRow[];
  comprehensive: PerfRow[];
  top3: PerfRow[]; bottom3: PerfRow[];
  totals: { schemes: number; positive: number; negative: number };
}

export interface Prose {
  universeOverview: string;
  debtSectionNote: string;
  highlightsIntro: string;
}

// ── Render-ready ("display") shapes ─────────────────────────────────────────
// The docx template prints these fields verbatim — numbers are pre-formatted
// (Indian-comma, signed, 2dp) strings, except the counts that must stay
// numeric (schemes / totalSchemes) because the template does no arithmetic
// on them but some call sites may still want a number type for clarity.
export interface UniverseCategoryDisplay {
  key: CategoryKey | "grand_total";
  label: string;
  schemes: number;
  aumCr: string;
  folios: string;
  grossInflowCr: string;
  netFlowCr: string;
}

export interface NsrSchemeDisplay {
  category: string;
  schemeNames: string;
  count: number;
  mobilisedCr: string;
}

export interface UniverseDisplay {
  monthLabel: string;
  categories: UniverseCategoryDisplay[];
  grandTotal: UniverseCategoryDisplay;
  nsr: { rows: NsrSchemeDisplay[]; totalSchemes: number; totalMobilisedCr: number };
}

export interface PerfRowDisplay {
  schemeName: string;
  shortCategory: string;
  amc: string;
  r1m: string; r3m: string; r6m: string; r1y: string; si: string;
  since: string;
}

export interface PerformanceDisplay {
  equity: PerfRowDisplay[]; hybrid: PerfRowDisplay[]; debt: PerfRowDisplay[];
  comprehensive: PerfRowDisplay[];
  top3: PerfRowDisplay[]; bottom3: PerfRowDisplay[];
  totals: { schemes: number; positive: number; negative: number };
}

export interface ReportModel {
  monthLabel: string; monthShort: string; asOfLong: string; asOfShort: string; year: number;
  monthUpper: string;
  snapshotAum: string;
  snapshotNetFlow: string;
  nsrMobilised: string;
  // Cover-page asterisk note, set only when the industry figures came from the
  // previous month because AMFI had not published the requested month yet.
  aumFootnote: string | null;
  universe: UniverseDisplay;
  perf: PerformanceDisplay;
  prose: Prose;
}
