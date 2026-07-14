import type { UniverseData, UniverseCategory, NsrScheme, CategoryKey } from "./types";

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

  // Reconcile: AMFI's own printed Sub Total rows must match the sum of their
  // member categories (an independent cross-check against the Grand Total guard above).
  const SUBTOTALS: { match: RegExp; members: CategoryKey[] }[] = [
    { match: /^Sub Total - I \(i\+ii\+iii\)/i, members: ["equity_ls", "equity_ex100_ls", "sector_rotation_ls"] },
    { match: /^Sub Total - II \(i\+ii\)/i, members: ["debt_ls"] },
    { match: /^Sub Total - III \(i\+ii\+iii\+iv\+v\+vi\)/i, members: ["aaa_ls", "hybrid_ls"] },
  ];
  for (const st of SUBTOTALS) {
    const line = lines.find((l) => st.match.test(l.trim()));
    if (!line) continue;
    const t = line.trim();
    const n = nums(t.replace(st.match, ""));
    if (n.length < 6) continue;
    const printed = rowFrom(n);
    const memberSum = st.members.reduce(
      (a, key) => {
        const c = found.get(key);
        if (!c) return a;
        return {
          schemes: a.schemes + c.schemes, folios: a.folios + c.folios,
          aumCr: round2(a.aumCr + c.aumCr), grossInflowCr: round2(a.grossInflowCr + c.grossInflowCr),
          netFlowCr: round2(a.netFlowCr + c.netFlowCr),
        };
      },
      { schemes: 0, folios: 0, aumCr: 0, grossInflowCr: 0, netFlowCr: 0 },
    );
    const subBad =
      memberSum.schemes !== printed.schemes ||
      memberSum.folios !== printed.folios ||
      Math.abs(memberSum.aumCr - printed.aumCr) > 0.5 ||
      Math.abs(memberSum.grossInflowCr - printed.grossInflowCr) > 0.5 ||
      Math.abs(memberSum.netFlowCr - printed.netFlowCr) > 0.5;
    if (subBad) {
      throw new Error(
        `AMFI reconciliation failed: sub-total members sum ${JSON.stringify(memberSum)} != printed sub-total ${JSON.stringify(
          { schemes: printed.schemes, folios: printed.folios, aumCr: printed.aumCr, grossInflowCr: printed.grossInflowCr, netFlowCr: printed.netFlowCr },
        )}`,
      );
    }
  }

  const nsr = parseNsr(lines);
  return { monthLabel, categories, grandTotal, nsr };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

// NSR rows: category label, wrapped scheme names, count, mobilised.
// A data row ends with "<count> <mobilised>" (both integers); the scheme-name
// column may wrap onto the next line (continuation lines have no trailing count).
function parseNsr(lines: string[]): UniverseData["nsr"] {
  const rows: NsrScheme[] = [];
  const NSR_CATS = [
    /^Equity Ex-Top 100 Long-Short Fund\b/i,
    /^Equity Long-Short Fund\b/i,
    /^Active Asset Allocator Long-Short Fund\b/i,
    /^Hybrid Long-Short Fund\b/i,
    /^Sector Rotation Long-Short Fund\b/i,
    /^Sectoral Debt Long-Short Fund\b/i,
    /^Debt Long-Short Fund\b/i,
  ];
  const LABEL: Record<string, string> = {
    "Equity Ex-Top 100 Long-Short Fund": "Equity Ex-Top 100 L-S",
    "Equity Long-Short Fund": "Equity Long-Short",
    "Active Asset Allocator Long-Short Fund": "Active Asset Allocator L-S",
    "Hybrid Long-Short Fund": "Hybrid Long-Short",
    "Sector Rotation Long-Short Fund": "Sector Rotation L-S",
  };

  // Only scan lines after the NEW SCHEMES marker if present; else scan all.
  for (const raw of lines) {
    const t = raw.trim();
    const cat = NSR_CATS.find((r) => r.test(t));
    if (!cat) continue;
    const n = nums(t);
    if (n.length < 2) continue;                  // continuation / header — skip
    const count = n[n.length - 2];
    const mobilised = n[n.length - 1];
    if (!Number.isInteger(count) || count <= 0) continue;
    const key = Object.keys(LABEL).find((k) => new RegExp("^" + k.replace(/[()]/g, "\\$&"), "i").test(t));
    // scheme names = text between the category label and the trailing two numbers
    const afterLabel = t.replace(cat, "").trim();
    const schemeNames = afterLabel.replace(/\s+\d[\d,]*\s+\d[\d,]*$/, "").trim();
    rows.push({ category: key ? LABEL[key] : t, schemeNames, count, mobilisedCr: mobilised });
  }
  const totalSchemes = rows.reduce((a, r) => a + r.count, 0);
  const totalMobilisedCr = round2(rows.reduce((a, r) => a + r.mobilisedCr, 0));
  return { rows, totalSchemes, totalMobilisedCr };
}
