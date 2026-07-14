import type { UniverseData, UniverseCategory, NsrScheme, CategoryKey } from "./types";
// NOTE: legacy build works in Node without a worker.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { monthMetaFromDate } from "./monthMeta";

// Report display order + canonical labels + match patterns (regex on the row label).
const CATS: { key: CategoryKey; label: string; match: RegExp }[] = [
  { key: "equity_ls",          label: "Equity Long-Short",           match: /^Equity Long-Short Fund/i },
  { key: "equity_ex100_ls",    label: "Equity Ex-Top 100 L-S",       match: /^Equity Ex-Top 100 Long-Short Fund/i },
  { key: "sector_rotation_ls", label: "Sector Rotation L-S",         match: /^Sector Rotation Long-Short Fund/i },
  { key: "aaa_ls",             label: "Active Asset Allocator (AAA) L-S", match: /^Active Asset Allocator Long-Short Fund/i },
  { key: "hybrid_ls",          label: "Hybrid Long-Short",           match: /^Hybrid Long-Short Fund/i },
  { key: "debt_ls",            label: "Debt Long-Short",             match: /^Debt Long-Short Fund/i },
];

// Extract all numeric tokens (handles "14,841" and "2,225.36") from a line.
function nums(line: string): number[] {
  const m = line.match(/-?[\d,]+\.\d+|-?[\d,]+/g) ?? [];
  return m.map((t) => Number(t.replace(/,/g, "")));
}

// AMFI column order after the label:
// [0]schemes [1]folios [2]mobilized [3]repurchase [4]netInflow [5]netAUM [6]avgAUM [7]seg [8]segAUM
function rowFrom(nums6: number[]): Omit<UniverseCategory, "key" | "label"> {
  return {
    schemes: nums6[0], folios: nums6[1], grossInflowCr: nums6[2],
    netFlowCr: nums6[4], aumCr: nums6[5],
  };
}

export function parseUniverseText(text: string, monthLabel: string): UniverseData {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());

  // Universe categories (in the AMFI order, then re-sorted to report order below).
  const found = new Map<CategoryKey, UniverseCategory>();
  for (const line of lines) {
    const t = line.trim();
    for (const c of CATS) {
      if (found.has(c.key)) continue;
      if (c.match.test(t)) {
        const n = nums(t.replace(c.match, ""));
        if (n.length >= 6) found.set(c.key, { key: c.key, label: c.label, ...rowFrom(n) });
      }
    }
  }
  const categories = CATS
    .map((c) => found.get(c.key))
    .filter((x): x is UniverseCategory => Boolean(x))
    // report order: equity_ls, equity_ex100_ls, sector_rotation_ls, aaa_ls, hybrid_ls, debt_ls
    ;

  // Grand Total line
  const gtLine = lines.find((l) => /^\s*Grand Total\b/.test(l));
  if (!gtLine) throw new Error("AMFI parse: Grand Total row not found");
  const gtn = nums(gtLine);
  const grandTotal: UniverseCategory = { key: "grand_total", label: "Grand Total", ...rowFrom(gtn) };

  // Reconcile: sum of the 6 categories must equal grand total (schemes, folios, aum, gross, net).
  const sum = categories.reduce(
    (a, c) => ({
      schemes: a.schemes + c.schemes, folios: a.folios + c.folios,
      aumCr: round2(a.aumCr + c.aumCr), grossInflowCr: round2(a.grossInflowCr + c.grossInflowCr),
      netFlowCr: round2(a.netFlowCr + c.netFlowCr),
    }),
    { schemes: 0, folios: 0, aumCr: 0, grossInflowCr: 0, netFlowCr: 0 },
  );
  const bad =
    sum.schemes !== grandTotal.schemes ||
    sum.folios !== grandTotal.folios ||
    Math.abs(sum.aumCr - grandTotal.aumCr) > 0.5 ||
    Math.abs(sum.grossInflowCr - grandTotal.grossInflowCr) > 0.5 ||
    Math.abs(sum.netFlowCr - grandTotal.netFlowCr) > 0.5;
  if (bad) {
    throw new Error(
      `AMFI reconciliation failed: categories sum ${JSON.stringify(sum)} != grand total ${JSON.stringify({
        schemes: grandTotal.schemes, folios: grandTotal.folios, aumCr: grandTotal.aumCr,
        grossInflowCr: grandTotal.grossInflowCr, netFlowCr: grandTotal.netFlowCr,
      })}`,
    );
  }

  // Reconcile: AMFI's own printed Sub Total rows must sum to the Grand Total.
  // Parsed directly from the printed lines (not reconstructed from category
  // members) so a future fund with no CategoryKey slot (e.g. "Sectoral Debt
  // Long-Short Fund") can never cause a false-positive reconciliation failure.
  const SUBTOTAL_LINES: { match: RegExp; label: string }[] = [
    { match: /^Sub Total - I \(i\+ii\+iii\)/i, label: "Sub Total - I" },
    { match: /^Sub Total - II \(i\+ii\)/i, label: "Sub Total - II" },
    { match: /^Sub Total - III \(i\+ii\+iii\+iv\+v\+vi\)/i, label: "Sub Total - III" },
  ];
  const subtotals = SUBTOTAL_LINES.map((st) => {
    const line = lines.find((l) => st.match.test(l.trim()));
    if (!line) throw new Error(`AMFI parse: ${st.label} row not found`);
    const t = line.trim();
    const n = nums(t.replace(st.match, ""));
    if (n.length < 6) throw new Error(`AMFI parse: ${st.label} row missing expected numeric columns`);
    return rowFrom(n);
  });
  const subtotalSum = subtotals.reduce(
    (a, s) => ({
      schemes: a.schemes + s.schemes, folios: a.folios + s.folios,
      aumCr: round2(a.aumCr + s.aumCr), grossInflowCr: round2(a.grossInflowCr + s.grossInflowCr),
      netFlowCr: round2(a.netFlowCr + s.netFlowCr),
    }),
    { schemes: 0, folios: 0, aumCr: 0, grossInflowCr: 0, netFlowCr: 0 },
  );
  const subBad =
    subtotalSum.schemes !== grandTotal.schemes ||
    subtotalSum.folios !== grandTotal.folios ||
    Math.abs(subtotalSum.aumCr - grandTotal.aumCr) > 0.5 ||
    Math.abs(subtotalSum.grossInflowCr - grandTotal.grossInflowCr) > 0.5 ||
    Math.abs(subtotalSum.netFlowCr - grandTotal.netFlowCr) > 0.5;
  if (subBad) {
    throw new Error(
      `AMFI reconciliation failed: sub-totals sum ${JSON.stringify(subtotalSum)} != grand total ${JSON.stringify({
        schemes: grandTotal.schemes, folios: grandTotal.folios, aumCr: grandTotal.aumCr,
        grossInflowCr: grandTotal.grossInflowCr, netFlowCr: grandTotal.netFlowCr,
      })}`,
    );
  }

  const nsr = parseNsr(lines);
  return { monthLabel, categories, grandTotal, nsr };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

// Reconstruct text lines from pdfjs text items by grouping on the y-coordinate
// and ordering left-to-right. Produces one string per visual line — the shape
// parseUniverseText expects.
export async function extractPdfLines(data: Uint8Array): Promise<string> {
  const doc = await getDocument({ data, useWorkerFetch: false, useSystemFonts: true }).promise;
  const out: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const byLine = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      const y = Math.round(item.transform[5]); // vertical position
      const x = item.transform[4];
      const key = Math.round(y / 2) * 2;        // bucket close y's together
      if (!byLine.has(key)) byLine.set(key, []);
      byLine.get(key)!.push({ x, s: item.str });
    }
    const ys = [...byLine.keys()].sort((a, b) => b - a); // top→bottom
    for (const y of ys) {
      const parts = byLine.get(y)!.sort((a, b) => a.x - b.x);
      // join with spaces so numeric columns stay separated for the number regex
      let joined = parts.map((p) => p.s).join(" ").replace(/\s+/g, " ").trim();
      // AMFI prints each row's serial marker ("i", "ii", "iii", "I", "II", ...) in
      // its own narrow column immediately left of the scheme-name label, on the
      // same visual line. Strip it so the label starts at column 0, matching the
      // shape parseUniverseText's anchored (^) label regexes expect.
      joined = joined.replace(/^[ivxIVX]{1,4}\s+(?=[A-Za-z])/, "");
      out.push(joined);
    }
  }
  return out.join("\n");
}

export async function fetchUniverse(toDate: string): Promise<UniverseData> {
  const meta = monthMetaFromDate(toDate);
  const res = await fetch(meta.amfiUrl, { cache: "no-store" } as RequestInit);
  if (!res.ok) {
    throw new Error(`AMFI report for ${meta.monthLabel} unavailable (HTTP ${res.status}) at ${meta.amfiUrl}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const lines = await extractPdfLines(buf);
  return parseUniverseText(lines, meta.monthLabel);
}

// NSR rows: category label, wrapped scheme names, count, mobilised.
// A data row ends with "<count> <mobilised>" (both integers); the scheme-name
// column may wrap onto the next line (continuation lines have no trailing count).
function parseNsr(lines: string[]): UniverseData["nsr"] {
  const rows: NsrScheme[] = [];
  // Each NSR category regex paired with its report label — one match does both jobs.
  const NSR_CATS: { match: RegExp; label: string }[] = [
    { match: /^Equity Ex-Top 100 Long-Short Fund\b/i, label: "Equity Ex-Top 100 L-S" },
    { match: /^Equity Long-Short Fund\b/i, label: "Equity Long-Short" },
    { match: /^Active Asset Allocator Long-Short Fund\b/i, label: "Active Asset Allocator L-S" },
    { match: /^Hybrid Long-Short Fund\b/i, label: "Hybrid Long-Short" },
    { match: /^Sector Rotation Long-Short Fund\b/i, label: "Sector Rotation L-S" },
    { match: /^Sectoral Debt Long-Short Fund\b/i, label: "Sectoral Debt Long-Short" },
    { match: /^Debt Long-Short Fund\b/i, label: "Debt Long-Short" },
  ];

  // Only scan lines after the NEW SCHEMES marker if present; else scan all.
  for (const raw of lines) {
    const t = raw.trim();
    const cat = NSR_CATS.find((r) => r.match.test(t));
    if (!cat) continue;
    const n = nums(t);
    if (n.length < 2) continue;                  // continuation / header — skip
    const count = n[n.length - 2];
    const mobilised = n[n.length - 1];
    if (!Number.isInteger(count) || count <= 0) continue;
    // scheme names = text between the category label and the trailing two numbers
    const afterLabel = t.replace(cat.match, "").trim();
    const schemeNames = afterLabel.replace(/\s+\d[\d,]*\s+\d[\d,]*$/, "").trim();
    rows.push({ category: cat.label, schemeNames, count, mobilisedCr: mobilised });
  }
  const totalSchemes = rows.reduce((a, r) => a + r.count, 0);
  const totalMobilisedCr = round2(rows.reduce((a, r) => a + r.mobilisedCr, 0));
  return { rows, totalSchemes, totalMobilisedCr };
}
