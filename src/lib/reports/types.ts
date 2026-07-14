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

export interface ReportModel {
  monthLabel: string; monthShort: string; asOfLong: string; asOfShort: string; year: number;
  universe: UniverseData;
  perf: PerformanceData;
  prose: Prose;
}
