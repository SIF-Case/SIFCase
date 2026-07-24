// AMFI SIF public feeds — scheme index, Scheme Summary Document (SSD), and TER.
//
// See docs/product/refactor/09-fund-details-sources.md. Three things about these
// feeds drive the shape of this file:
//
// 1. SSD is served in THREE unrelated XML schemas (see parseSsd). They are not
//    variants of one format — field ORDER differs, so everything is keyed on the
//    field NAME normalised to lowercase-alphanumeric, never on position.
// 2. Not every scheme has an SSD. Four of 28 return a 404 HTML page today, one of
//    which (S-22) is a fund already live on the site. A miss is "no news", never
//    "no value" — callers must leave stored values alone.
// 3. The scheme_id bridge exposes no ISIN, so the fund match starts as a name
//    match. SSD formats A and B carry ISINs and can confirm it; format C ships an
//    empty ISINs element, so those funds can never reach ISIN-verified.

const UA = "Mozilla/5.0 (compatible; SIFcase/1.0)";
const AMFI_API = "https://www.amfiindia.com/api";
const SSD_BASE = "https://portal.amfiindia.com/spages";

export type SsdFormat = "SchemeSummaryDocument" | "SpreadsheetML" | "TypedRoot";

export interface SsdDoc {
  schemeId: string;
  format: SsdFormat;
  /** Field name normalised to lowercase-alphanumeric -> raw text value. */
  fields: Record<string, string>;
  isins: string[];
}

export interface SsdMiss {
  schemeId: string;
  /** http status when the fetch completed, or 0 for a transport failure */
  status: number;
  reason: string;
}

export type SsdResult = { ok: true; doc: SsdDoc } | { ok: false; miss: SsdMiss };

export interface SchemeIndexRow {
  sifId: number;
  schemeName: string;
  schemeId: string;
}

export interface TerRow {
  sifId: string;
  schemeName: string;
  nsdlSchemeCode: string;
  schemeCategory: string;
  terYear: string;
  terDate: string;
  regular: TerSplit;
  direct: TerSplit;
}

export interface TerSplit {
  ber: string;
  brokerageCost: string;
  transactionCost: string;
  statutoryLevies: string;
  ter: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Join key for every name comparison in this module and its callers. */
export function normaliseName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fieldKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const ISIN_RE = /INF[A-Z0-9]{9}/g;

async function getText(url: string, timeoutMs = 30_000): Promise<{ status: number; text: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*" },
      cache: "no-store",
      signal: ctl.signal,
    });
    return { status: res.status, text: await res.text() };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Rupee amount out of an SSD cell. These are frequently prose, not a figure:
 *
 *   "Rs.10,00,000"
 *   "For normal investors - Rs. 10 lakh and in multiples of Re. 1 thereafter"
 *   "•\tMinimum amount for other than accredited investor 10,00,000/- and in…"
 *
 * So: collect every number, apply any lakh/crore unit attached to it, drop the
 * "multiples of Re. 1" noise via `floor`, and take the largest survivor. Taking
 * the first number instead would read that middle example as ₹10.
 *
 * Returns null when nothing clears `floor` — callers must then leave the stored
 * value alone rather than writing a number we do not actually believe.
 */
export function parseRupees(raw: string | undefined, floor = 1000): number | null {
  if (!raw) return null;
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|crores?|cr\b)?/gi;
  const candidates: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const n = Number.parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    const unit = (m[2] ?? "").toLowerCase();
    const mult = /^l/.test(unit) ? 1e5 : /^c/.test(unit) ? 1e7 : 1;
    candidates.push(n * mult);
  }
  const usable = candidates.filter((v) => v >= floor);
  return usable.length ? Math.max(...usable) : null;
}

/**
 * Riskometer text is written differently in every format:
 * "Level 1", "Level  2" (double space), "Risk Band Level 2", "Risk Level - 1".
 * Take the first standalone 1-5 rather than trying to match each phrasing.
 */
export function parseRiskBand(raw: string | undefined): 1 | 2 | 3 | 4 | 5 | null {
  if (!raw) return null;
  const m = raw.match(/([1-5])\b/);
  if (!m) return null;
  return Number(m[1]) as 1 | 2 | 3 | 4 | 5;
}

/** Values AMFI uses for "nothing here". Treated as absent, not as content. */
export function isBlank(raw: string | undefined): boolean {
  if (!raw) return true;
  const v = raw.trim();
  return v === "" || /^(na|n\.a\.?|nil|not applicable|no|-|—)$/i.test(v);
}

// ── scheme index (SIF_Id -> schemes) ─────────────────────────────────────────

export async function fetchSchemesForSifId(sifId: number | string): Promise<SchemeIndexRow[]> {
  const { status, text } = await getText(`${AMFI_API}/populate-investment-strategy?sif_id=${sifId}`);
  if (status !== 200) throw new Error(`populate-investment-strategy ${sifId} -> HTTP ${status}`);
  const rows = JSON.parse(text) as { SIF_Id: number; scheme_name: string; scheme_id: string }[];
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({ sifId: r.SIF_Id, schemeName: r.scheme_name, schemeId: r.scheme_id }));
}

// ── SSD ──────────────────────────────────────────────────────────────────────

function stripTags(xml: string): string {
  return xml;
}

/**
 * Format A — <SchemeSummaryDocument><SchemeSummary><Field>value</Field>...
 * Format C — <root type="object"><Field type="string">value</Field>...
 * Both are "named element -> text", so one regex walk covers them.
 */
function parseNamedElements(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Inner group is [^<]* so this only ever matches leaf elements. Matching
  // containers and skipping them does not work: a skipped match still leaves
  // lastIndex past the container's closing tag, swallowing every leaf inside it.
  const re = /<([A-Za-z_][A-Za-z0-9_.-]*)\b[^>]*>([^<]*)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const key = fieldKey(m[1]);
    const val = decodeEntities(m[2]).trim();
    if (val && !(key in out)) out[key] = val;
  }
  return out;
}

/**
 * Format B — SpreadsheetML. Rows are [index, label, value], so the label cell
 * supplies the field name and the third cell the value.
 */
function parseSpreadsheetMl(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  const rowRe = /<Row[^>]*>([\s\S]*?)<\/Row>/g;
  const cellRe = /<Cell[^>]*>[\s\S]*?<Data[^>]*>([\s\S]*?)<\/Data>[\s\S]*?<\/Cell>/g;
  let r: RegExpExecArray | null;
  while ((r = rowRe.exec(xml)) !== null) {
    const cells: string[] = [];
    let c: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((c = cellRe.exec(r[1])) !== null) cells.push(decodeEntities(c[1]).trim());
    if (cells.length >= 3 && /^\d+$/.test(cells[0])) {
      const key = fieldKey(cells[1]);
      const val = cells.slice(2).filter(Boolean).join(" ").trim();
      if (val && !(key in out)) out[key] = val;
    }
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function parseSsd(schemeId: string, xml: string): SsdResult {
  let format: SsdFormat;
  let fields: Record<string, string>;

  if (xml.includes("SchemeSummaryDocument")) {
    format = "SchemeSummaryDocument";
    fields = parseNamedElements(stripTags(xml));
  } else if (xml.includes("urn:schemas-microsoft-com:office:spreadsheet")) {
    format = "SpreadsheetML";
    fields = parseSpreadsheetMl(xml);
  } else if (/^\s*<root\b/.test(xml)) {
    format = "TypedRoot";
    fields = parseNamedElements(xml);
  } else {
    return {
      ok: false,
      miss: { schemeId, status: 200, reason: "response is not a recognised SSD format" },
    };
  }

  if (Object.keys(fields).length === 0) {
    return { ok: false, miss: { schemeId, status: 200, reason: "SSD parsed to zero fields" } };
  }

  return {
    ok: true,
    doc: { schemeId, format, fields, isins: [...new Set(xml.match(ISIN_RE) ?? [])] },
  };
}

export async function fetchSsd(schemeId: string): Promise<SsdResult> {
  let status = 0;
  let text = "";
  try {
    ({ status, text } = await getText(`${SSD_BASE}/SSD_${schemeId}.xml`));
  } catch (err) {
    return {
      ok: false,
      miss: { schemeId, status: 0, reason: err instanceof Error ? err.message : String(err) },
    };
  }
  if (status !== 200) {
    return { ok: false, miss: { schemeId, status, reason: `SSD not published (HTTP ${status})` } };
  }
  return parseSsd(schemeId, text);
}

// ── SSD field extraction ─────────────────────────────────────────────────────

/** Canonical FundDetails values an SSD can supply. Absent stays undefined. */
export interface SsdExtract {
  fundName?: string;
  riskBand?: 1 | 2 | 3 | 4 | 5;
  benchmarkRiskBand?: 1 | 2 | 3 | 4 | 5;
  exitLoad?: string;
  minInvestment?: number;
  additionalInvestment?: number;
  benchmarkName?: string;
  benchmarkDetails?: string;
  registrarName?: string;
  inceptionDate?: string;
  schemeCategory?: string;
  statedAssetAllocation?: string;
  annualExpenseStatedMaximum?: string;
}

function pick(fields: Record<string, string>, ...aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = fields[fieldKey(a)];
    if (!isBlank(v)) return v.trim();
  }
  return undefined;
}

/**
 * The current riskometer reading has no stable field name. Observed in the wild:
 * Riskometer_as_on_Date, Risk_Band_as_on_Date, and date-stamped variants such as
 * Riskometer_June_30_2026 / Riskometer_March_31_2026. Match on the prefix and
 * exclude the at-launch reading, which is a different (and often stale) number.
 */
function pickCurrentRiskometer(fields: Record<string, string>): string | undefined {
  const keys = Object.keys(fields).filter(
    (k) => (k.startsWith("riskometer") || k.startsWith("riskband")) && !k.includes("atthetimeoflaunch"),
  );
  // Prefer the explicit "as on date" spelling; otherwise any dated variant.
  const preferred = keys.find((k) => k.includes("asondate")) ?? keys[0];
  const v = preferred ? fields[preferred] : undefined;
  return v === undefined || isBlank(v) ? undefined : v.trim();
}

export function extractFromSsd(doc: SsdDoc): SsdExtract {
  const f = doc.fields;
  const out: SsdExtract = {};

  const set = <K extends keyof SsdExtract>(k: K, v: SsdExtract[K]) => {
    if (v !== undefined && v !== null && v !== ("" as unknown)) out[k] = v;
  };

  set("fundName", pick(f, "Fund_Name"));
  set("riskBand", parseRiskBand(pickCurrentRiskometer(f)) ?? undefined);
  set("exitLoad", pick(f, "Exit_Load_if_applicable", "Exit Load if applicable"));
  set("minInvestment", parseRupees(pick(f, "Minimum_Application_Amount")) ?? undefined);
  // Additional-investment cells go as low as ₹1,000, so the floor drops to match.
  set("additionalInvestment", parseRupees(pick(f, "Minimum_Additional_Amount"), 100) ?? undefined);
  set("benchmarkName", pick(f, "Benchmark_Tier_1"));
  set("benchmarkDetails", pick(f, "Benchmark_Tier_2"));
  set("registrarName", pick(f, "Registrar"));
  set("inceptionDate", pick(f, "Allotment_Date"));
  set("schemeCategory", pick(f, "Category_as_Per_SEBI_Categorization_Circular"));
  // Free text ("Debt & Money Market Instruments - 35 % to 65%"), stored raw —
  // parsing it into min/max ranges is too brittle against the phrasing variance.
  set("statedAssetAllocation", pick(f, "Stated_Asset_Allocation", "Stated_Asset_Allocation1"));
  set("annualExpenseStatedMaximum", pick(f, "Annual_Expense_Stated_maximum"));

  return out;
}

// ── TER ──────────────────────────────────────────────────────────────────────

function monthParam(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export interface TerFetch {
  month: string;
  rows: TerRow[];
  /** true when the current month was empty and the previous month was used */
  usedFallback: boolean;
  /** set when AMFI paginates — we only ever read page 1, so this must stay false */
  truncated: boolean;
}

async function fetchTerMonth(month: string): Promise<{ rows: TerRow[]; pageCount: number }> {
  const qs = new URLSearchParams({
    SIF_Id: "",
    Month: month,
    strCat: "-1",
    strType: "-1",
    page: "1",
    pageSize: "1000",
  });
  const { status, text } = await getText(`${AMFI_API}/sif-populate-te-rdata-revised?${qs}`, 45_000);
  if (status !== 200) throw new Error(`TER feed -> HTTP ${status}`);
  const json = JSON.parse(text) as {
    data?: Record<string, string>[];
    meta?: { pageCount?: number };
  };
  const rows = (json.data ?? []).map((d) => ({
    sifId: String(d.SIF_Id ?? ""),
    schemeName: d.Scheme_Name ?? "",
    nsdlSchemeCode: d.NSDLSchemeCode ?? "",
    schemeCategory: d.SchemeCat_Desc ?? "",
    terYear: d.TER_Year ?? "",
    terDate: d.TER_Date ?? "",
    regular: {
      ber: d.R_BER ?? "", brokerageCost: d.R_BrokerageCost ?? "",
      transactionCost: d.R_TransactionCost ?? "", statutoryLevies: d.R_StatutoryLevies ?? "",
      ter: d.R_TER ?? "",
    },
    direct: {
      ber: d.D_BER ?? "", brokerageCost: d.D_BrokerageCost ?? "",
      transactionCost: d.D_TransactionCost ?? "", statutoryLevies: d.D_StatutoryLevies ?? "",
      ter: d.D_TER ?? "",
    },
  }));
  return { rows, pageCount: json.meta?.pageCount ?? 1 };
}

/**
 * The feed is keyed on a calendar month. On the 1st the new month may not be
 * published yet, so fall back to the previous month rather than reporting zero.
 */
export async function fetchTer(now = new Date()): Promise<TerFetch> {
  const current = monthParam(now);
  let { rows, pageCount } = await fetchTerMonth(current);
  if (rows.length > 0) {
    return { month: current, rows, usedFallback: false, truncated: pageCount > 1 };
  }
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = monthParam(prevDate);
  ({ rows, pageCount } = await fetchTerMonth(prev));
  return { month: prev, rows, usedFallback: true, truncated: pageCount > 1 };
}

/** Distinct SIF_Ids present in the TER feed — the provider list, not hardcoded. */
export function sifIdsFromTer(rows: TerRow[]): string[] {
  return [...new Set(rows.map((r) => r.sifId).filter(Boolean))];
}
