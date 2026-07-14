# SIF Monthly Report (.docx) Download — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Download Report" button on `/admin/nav-records` that generates an exact-clone `.docx` monthly SIF report for the selected month, with AMFI universe data, NAV performance tables, and AI-written prose.

**Architecture:** A `POST /api/admin/nav-records/report` route orchestrates three data sources — deterministic AMFI-PDF parsing, refactored NAV-performance compute, and a thin AI prose layer — then fills a tagged clone of the real report `.docx` via `docxtemplater`. Fixed regulatory text is cloned untouched from the template; only month-varying slots are replaced. Charts/images are left empty for manual paste.

**Tech Stack:** Next.js (App Router, route handlers), MongoDB (mongoose), `docxtemplater` + `pizzip` (docx render), `pdfjs-dist` (PDF text extraction), Vercel `ai` SDK / raw fetch (AI prose, existing pattern), `ts-node` + `node:assert` (tests).

## Global Constraints

- **Fixed regulatory text is NEVER regenerated.** SEBI strategy definitions, allocation-range tables, and the disclaimer are cloned byte-for-byte from the template. AI touches only month-varying prose.
- **No AI on financial numbers.** AMFI universe figures are parsed deterministically and reconciled (sub-totals must sum to grand total) or the request fails.
- **Canonical scheme row = `plan="Regular"`, `option="Growth"`** — one row per scheme; no Direct, no IDCW variants.
- **Month source = the page's As Of Date filter.** Report month = month of `toDate`.
- **AMFI URL pattern:** `https://portal.amfiindia.com/spages/sif_am<mon><yyyy>repo.pdf`, `<mon>` = lowercase 3-letter month, `<yyyy>` = 4-digit year.
- **Output filename:** `SIF_Monthly_Report_<Mon><Year>.docx` (e.g. `SIF_Monthly_Report_Jun2026.docx`).
- **Page-2 Market Snapshot images and section-02 category charts stay empty** in the template (surrounding headings/captions kept).
- **Auth guard:** reuse `hasAnyPageAccess(req, ["funds","schemes"], "view")` (same as the existing nav-records route).
- **Test runner:** `npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register <file>`; tests use `node:assert/strict`, print `OK` on success, throw (non-zero exit) on failure. No new test framework.

---

## File Structure

**Create:**
- `src/lib/reports/types.ts` — shared TypeScript types for the whole feature.
- `src/lib/reports/monthMeta.ts` — month → AMFI slug + label helpers.
- `src/lib/reports/amfiUniverse.ts` — parse (`parseUniverseText`) + fetch (`fetchUniverse`).
- `src/lib/reports/navPerformance.ts` — shared NAV compute + report grouping.
- `src/lib/reports/aiProse.ts` — AI prose with deterministic fallback.
- `src/lib/reports/buildReportData.ts` — orchestrator → template data model.
- `src/lib/reports/renderDocx.ts` — fill template → Buffer.
- `src/reports/monthly-template.docx` — tagged clone of the reference report (server asset).
- `src/app/api/admin/nav-records/report/route.ts` — the endpoint.
- `scripts/build-report-template.ts` — one-shot builder that produces the template docx.
- `tests/reports/amfiUniverse.test.ts`, `tests/reports/navPerformance.test.ts`, `tests/reports/renderDocx.test.ts`, `tests/reports/monthMeta.test.ts`.
- `tests/fixtures/amfi-jun2026.txt`, `tests/fixtures/amfi-jun2026.pdf`.

**Modify:**
- `src/app/api/admin/nav-records/route.ts` — import compute from `navPerformance.ts` (behaviour unchanged).
- `src/app/admin/nav-records/page.tsx` — add "Download Report" button + `downloadReport()`.
- `package.json` — add deps + `test` convenience script.
- `src/app/admin/settings/AISettingsClient.tsx` — add `monthly-report` usage option (only if usages are a fixed client-side list; skip if free-text).

---

## Task 1: Dependencies, types, month helpers, test harness

**Files:**
- Modify: `package.json`
- Create: `src/lib/reports/types.ts`
- Create: `src/lib/reports/monthMeta.ts`
- Test: `tests/reports/monthMeta.test.ts`

**Interfaces:**
- Produces: `types.ts` exports `UniverseCategory`, `NsrScheme`, `UniverseData`, `PerfRow`, `PerformanceData`, `Prose`, `ReportModel`.
- Produces: `monthMeta.ts` exports `monthMetaFromDate(toDate: string): MonthMeta` where
  `MonthMeta = { mon: string; year: number; monthLabel: string; monthShort: string; asOfLong: string; asOfShort: string; amfiUrl: string; fileMon: string }`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install docxtemplater pizzip pdfjs-dist
```
Expected: added to `dependencies` in `package.json`, no errors.

- [ ] **Step 2: Add a `test` convenience script to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "ts-node --project tsconfig.scripts.json -r tsconfig-paths/register"
```
(Usage: `npm test tests/reports/foo.test.ts`.)

- [ ] **Step 3: Create shared types**

Create `src/lib/reports/types.ts`:
```ts
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
```

- [ ] **Step 4: Write the failing test for monthMeta**

Create `tests/reports/monthMeta.test.ts`:
```ts
import assert from "node:assert/strict";
import { monthMetaFromDate } from "@/lib/reports/monthMeta";

const m = monthMetaFromDate("2026-06-30");
assert.equal(m.mon, "jun");
assert.equal(m.year, 2026);
assert.equal(m.monthLabel, "June 2026");
assert.equal(m.monthShort, "Jun 2026");
assert.equal(m.asOfLong, "30th Jun 2026");
assert.equal(m.asOfShort, "Jun 30, 2026");
assert.equal(m.fileMon, "Jun");
assert.equal(m.amfiUrl, "https://portal.amfiindia.com/spages/sif_amjun2026repo.pdf");

// mid-month As Of date still resolves to month-end labels
const m2 = monthMetaFromDate("2026-05-14");
assert.equal(m2.amfiUrl, "https://portal.amfiindia.com/spages/sif_ammay2026repo.pdf");
assert.equal(m2.asOfLong, "31st May 2026");

console.log("OK monthMeta");
```

- [ ] **Step 5: Run test, verify it fails**

Run: `npm test tests/reports/monthMeta.test.ts`
Expected: FAIL — cannot find module `@/lib/reports/monthMeta`.

- [ ] **Step 6: Implement monthMeta**

Create `src/lib/reports/monthMeta.ts`:
```ts
export interface MonthMeta {
  mon: string; year: number; monthLabel: string; monthShort: string;
  asOfLong: string; asOfShort: string; amfiUrl: string; fileMon: string;
}

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ordinal(d: number): string {
  const s = ["th","st","nd","rd"], v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function monthMetaFromDate(toDate: string): MonthMeta {
  const dt = new Date(toDate + "T00:00:00Z");
  const y = dt.getUTCFullYear();
  const mi = dt.getUTCMonth();
  const mon = MONTHS[mi];
  const monTitle = mon.charAt(0).toUpperCase() + mon.slice(1); // "Jun"
  const lastDay = new Date(Date.UTC(y, mi + 1, 0)).getUTCDate();
  return {
    mon, year: y, fileMon: monTitle,
    monthLabel: `${FULL[mi]} ${y}`,
    monthShort: `${monTitle} ${y}`,
    asOfLong: `${ordinal(lastDay)} ${monTitle} ${y}`,
    asOfShort: `${monTitle} ${lastDay}, ${y}`,
    amfiUrl: `https://portal.amfiindia.com/spages/sif_am${mon}${y}repo.pdf`,
  };
}
```

- [ ] **Step 7: Run test, verify it passes**

Run: `npm test tests/reports/monthMeta.test.ts`
Expected: `OK monthMeta`.

- [ ] **Step 8: Commit**
```bash
git add package.json package-lock.json src/lib/reports/types.ts src/lib/reports/monthMeta.ts tests/reports/monthMeta.test.ts
git commit -m "feat(report): add deps, report types, month helpers"
```

---

## Task 2: AMFI universe parser (deterministic + reconciled)

**Files:**
- Create: `src/lib/reports/amfiUniverse.ts` (parser half)
- Create: `tests/fixtures/amfi-jun2026.txt`
- Test: `tests/reports/amfiUniverse.test.ts`

**Interfaces:**
- Consumes: `UniverseData`, `UniverseCategory`, `NsrScheme` from `types.ts`.
- Produces: `parseUniverseText(text: string, monthLabel: string): UniverseData` — pure, no I/O.

- [ ] **Step 1: Create the fixture text** (verbatim `pdftotext -layout` output of the Jun-2026 AMFI PDF)

Create `tests/fixtures/amfi-jun2026.txt` with exactly this content:
```
      Equity Long-Short Fund                                9         14,841          433.94          100.74        333.20        2,225.36       2,095.85           0.00           0.00
      Equity Ex-Top 100 Long-Short Fund                     5         20,615          772.31           19.47        752.84        2,764.48       2,390.73           0.00           0.00
      Sector Rotation Long-Short Fund                       1            308           10.70            0.11         10.59           45.66          40.45           0.00           0.00
      Sub Total - I (i+ii+iii)                             15         35,764        1,216.95          120.32      1,096.62        5,035.50       4,527.04           0.00           0.00
      Debt Long-Short Fund                                  0              0            0.00            0.00          0.00            0.00           0.00           0.00           0.00
      Sectoral Debt Long-Short Fund                         0              0            0.00            0.00          0.00            0.00           0.00           0.00           0.00
      Sub Total - II (i+ii)                                 0              0            0.00            0.00          0.00            0.00           0.00           0.00           0.00
      Active Asset Allocator Long-Short Fund                3          5,268          645.02            2.22        642.80          912.76         751.86           0.00           0.00
      Hybrid Long-Short Fund                                9         34,000        2,304.98          262.44      2,042.54       11,909.50      10,771.05           0.00           0.00
      Sub Total - III (i+ii+iii+iv+v+vi)                   12         39,268        2,950.00          264.66      2,685.34       12,822.27      11,522.91           0.00           0.00
      Grand Total                                          27         75,032        4,166.94          384.98      3,781.96       17,857.77      16,049.95           0.00           0.00
Equity Ex-Top 100 Long-Short Fund               Altiva Equity Ex- Top 100 Long - Short Fund, DynaSIF   2         338
Equity Long-Short Fund                          iSIF Equity Long-Short Fund                            1         212
Active Asset Allocator Long-Short Fund          iSIF Active Asset Allocator Long-Short Fund            1         478
Hybrid Long-Short Fund                          Platinum Hybrid Long-Short Fund, RedHex Hybrid Long-   2         712
```

- [ ] **Step 2: Write the failing test**

Create `tests/reports/amfiUniverse.test.ts`:
```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseUniverseText } from "@/lib/reports/amfiUniverse";

const text = readFileSync(join(process.cwd(), "tests/fixtures/amfi-jun2026.txt"), "utf8");
const u = parseUniverseText(text, "June 2026");

// 6 category rows in report order
assert.equal(u.categories.length, 6);
assert.equal(u.categories[0].label, "Equity Long-Short");
const eqLs = u.categories[0];
assert.equal(eqLs.schemes, 9);
assert.equal(eqLs.folios, 14841);
assert.equal(eqLs.grossInflowCr, 433.94);
assert.equal(eqLs.netFlowCr, 333.20);
assert.equal(eqLs.aumCr, 2225.36);

// grand total
assert.equal(u.grandTotal.schemes, 27);
assert.equal(u.grandTotal.folios, 75032);
assert.equal(u.grandTotal.grossInflowCr, 4166.94);
assert.equal(u.grandTotal.netFlowCr, 3781.96);
assert.equal(u.grandTotal.aumCr, 17857.77);

// NSR
assert.equal(u.nsr.totalSchemes, 6);
assert.equal(u.nsr.totalMobilisedCr, 1740);
assert.equal(u.nsr.rows.length, 4);

// reconciliation guard: mutating a sub-total breaks the sum → throws
const broken = text.replace("15         35,764", "14         35,764");
assert.throws(() => parseUniverseText(broken, "June 2026"), /reconcil/i);

console.log("OK amfiUniverse");
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm test tests/reports/amfiUniverse.test.ts`
Expected: FAIL — cannot find `parseUniverseText`.

- [ ] **Step 4: Implement the parser**

Create `src/lib/reports/amfiUniverse.ts`:
```ts
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
        const n = nums(t);
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
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm test tests/reports/amfiUniverse.test.ts`
Expected: `OK amfiUniverse`.
If NSR totals mismatch (6 / 1740), adjust `parseNsr` filtering until the fixture asserts pass — do NOT change the fixture.

- [ ] **Step 6: Commit**
```bash
git add src/lib/reports/amfiUniverse.ts tests/reports/amfiUniverse.test.ts tests/fixtures/amfi-jun2026.txt
git commit -m "feat(report): deterministic AMFI universe parser with reconciliation"
```

---

## Task 3: AMFI fetch via pdfjs (network → text → parse)

**Files:**
- Modify: `src/lib/reports/amfiUniverse.ts` (add fetch half)
- Create: `tests/fixtures/amfi-jun2026.pdf`
- Test: extend `tests/reports/amfiUniverse.test.ts` with an integration assertion.

**Interfaces:**
- Consumes: `parseUniverseText`, `monthMetaFromDate`.
- Produces: `extractPdfLines(data: Uint8Array): Promise<string>` and `fetchUniverse(toDate: string): Promise<UniverseData>`.

- [ ] **Step 1: Save the real PDF as a fixture**

Run:
```bash
mkdir -p tests/fixtures
curl -sL -o tests/fixtures/amfi-jun2026.pdf "https://portal.amfiindia.com/spages/sif_amjun2026repo.pdf"
```
Expected: ~132 KB PDF file.

- [ ] **Step 2: Write the failing integration test** (append to `tests/reports/amfiUniverse.test.ts`)

```ts
// ── pdfjs extraction path ──────────────────────────────────────────────
import { extractPdfLines } from "@/lib/reports/amfiUniverse";
(async () => {
  const buf = readFileSync(join(process.cwd(), "tests/fixtures/amfi-jun2026.pdf"));
  const lines = await extractPdfLines(new Uint8Array(buf));
  const u2 = parseUniverseText(lines, "June 2026");
  assert.equal(u2.grandTotal.schemes, 27);
  assert.equal(u2.grandTotal.aumCr, 17857.77);
  assert.equal(u2.nsr.totalMobilisedCr, 1740);
  console.log("OK amfiUniverse pdfjs");
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm test tests/reports/amfiUniverse.test.ts`
Expected: FAIL — `extractPdfLines` not exported.

- [ ] **Step 4: Implement pdfjs extraction + fetch** (append to `src/lib/reports/amfiUniverse.ts`)

```ts
// NOTE: legacy build works in Node without a worker.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { monthMetaFromDate } from "./monthMeta";

// Reconstruct text lines from pdfjs text items by grouping on the y-coordinate
// and ordering left-to-right. Produces one string per visual line — the shape
// parseUniverseText expects.
export async function extractPdfLines(data: Uint8Array): Promise<string> {
  const doc = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
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
      out.push(parts.map((p) => p.s).join(" ").replace(/\s+/g, " ").trim());
    }
  }
  return out.join("\n");
}

export async function fetchUniverse(toDate: string): Promise<UniverseData> {
  const meta = monthMetaFromDate(toDate);
  const res = await fetch(meta.amfiUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`AMFI report for ${meta.monthLabel} unavailable (HTTP ${res.status}) at ${meta.amfiUrl}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const lines = await extractPdfLines(buf);
  return parseUniverseText(lines, meta.monthLabel);
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm test tests/reports/amfiUniverse.test.ts`
Expected: `OK amfiUniverse` then `OK amfiUniverse pdfjs`.
If pdfjs line reconstruction splits/merges columns differently than the `pdftotext` fixture, tune the y-bucket rounding (`Math.round(y/2)*2`) and the `join(" ")` spacing until the number sequence per row is intact and the totals assert. The reconciliation guard guarantees you'll catch a bad parse.

- [ ] **Step 6: Commit**
```bash
git add src/lib/reports/amfiUniverse.ts tests/reports/amfiUniverse.test.ts tests/fixtures/amfi-jun2026.pdf
git commit -m "feat(report): fetch AMFI PDF and extract via pdfjs"
```

---

## Task 4: NAV performance — refactor shared compute + report grouping

**Files:**
- Create: `src/lib/reports/navPerformance.ts`
- Modify: `src/app/api/admin/nav-records/route.ts` (delegate to the shared function)
- Test: `tests/reports/navPerformance.test.ts`

**Interfaces:**
- Consumes: `PerfRow`, `PerformanceData` from `types.ts`; mongoose `connectDB`.
- Produces:
  - `computeSchemeReturns(opts): Promise<{ schemes: RawSchemeRow[]; categoryAverages; top3; bottom3; total; toDate }>` — the exact shape the current route returns (so the route's JSON is unchanged).
  - `computeReportPerformance(toDate: string): Promise<PerformanceData>` — grouped for the report (Regular·Growth).
  - `shortCategoryOf(strategy: string): string`.

- [ ] **Step 1: Write the failing test** (uses a live DB connection, mirrors existing script style)

Create `tests/reports/navPerformance.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test tests/reports/navPerformance.test.ts`
Expected: FAIL — cannot find `@/lib/reports/navPerformance`.

- [ ] **Step 3: Extract the compute into the lib**

Create `src/lib/reports/navPerformance.ts`. Move the helper functions and the core computation from `src/app/api/admin/nav-records/route.ts` (`subtractPeriod`, `navAtDate`, `navAtInception`, `pctReturn`, `avg`, `fmtSince`, and the per-scheme loop) into an exported `computeSchemeReturns`. Keep the returned object shape identical to the current route JSON. Then add report-specific helpers:
```ts
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import type { PerfRow, PerformanceData } from "./types";

// ... (moved helpers: subtractPeriod, navAtDate, navAtInception, pctReturn, avg, fmtSince)

export interface RawSchemeRow {
  schemeCode: string; schemeName: string; amc: string; strategy: string;
  plan: string; option: string;
  currentNav: number | null; currentNavDate: string | null;
  inceptionDate: string | null; inceptionLabel: string | null;
  returns: { "1m": number|null; "3m": number|null; "6m": number|null; "1y": number|null; si: number|null };
}

export async function computeSchemeReturns(opts: {
  toDate: string; plan: string; option: string; q?: string;
}): Promise<{
  schemes: RawSchemeRow[];
  categoryAverages: Record<string, Record<string, number | null>>;
  top3: RawSchemeRow[]; bottom3: RawSchemeRow[]; total: number; toDate: string;
}> {
  // ... identical logic to the current route body (minus the auth/NextResponse) ...
}

export function shortCategoryOf(strategy: string): string {
  const s = (strategy || "").toLowerCase();
  if (s.includes("ex-top 100")) return "Ex-100 L-S";
  if (s.includes("sector rotation")) return "Sector R L-S";
  if (s.includes("active asset allocator")) return "AAA L-S";
  if (s.includes("hybrid")) return "Hybrid L-S";
  if (s.includes("equity")) return "Equity L-S";
  if (s.includes("debt")) return "Debt L-S";
  return strategy || "—";
}

function isEquity(strategy: string): boolean {
  const s = (strategy || "").toLowerCase();
  return s.includes("equity") || s.includes("sector rotation");
}
function isHybrid(strategy: string): boolean {
  const s = (strategy || "").toLowerCase();
  return s.includes("hybrid") || s.includes("active asset allocator");
}
function isDebt(strategy: string): boolean {
  return (strategy || "").toLowerCase().includes("debt") && !isHybrid(strategy);
}

function toPerfRow(r: RawSchemeRow): PerfRow {
  return {
    schemeName: r.schemeName, category: r.strategy, shortCategory: shortCategoryOf(r.strategy),
    amc: r.amc, r1m: r.returns["1m"], r3m: r.returns["3m"], r6m: r.returns["6m"],
    r1y: r.returns["1y"], si: r.returns.si, since: r.inceptionLabel,
  };
}

export async function computeReportPerformance(toDate: string): Promise<PerformanceData> {
  const { schemes } = await computeSchemeReturns({ toDate, plan: "Regular", option: "Growth" });
  const rows = schemes.map(toPerfRow);
  const byName = (a: PerfRow, b: PerfRow) => a.schemeName.localeCompare(b.schemeName);
  const comprehensive = [...rows].sort(byName);
  const equity = comprehensive.filter((r) => isEquity(r.category));
  const hybrid = comprehensive.filter((r) => isHybrid(r.category));
  const debt = comprehensive.filter((r) => isDebt(r.category));
  const with1m = rows.filter((r) => r.r1m !== null);
  const sorted = [...with1m].sort((a, b) => (b.r1m ?? 0) - (a.r1m ?? 0));
  const top3 = sorted.slice(0, 3);
  const bottom3 = [...sorted].reverse().slice(0, 3);
  const positive = rows.filter((r) => (r.r1m ?? -Infinity) > 0).length;
  const negative = rows.filter((r) => r.r1m !== null && r.r1m < 0).length;
  return { equity, hybrid, debt, comprehensive, top3, bottom3, totals: { schemes: rows.length, positive, negative } };
}
```

- [ ] **Step 4: Wire the route to the shared function**

In `src/app/api/admin/nav-records/route.ts`, replace the moved logic: keep the auth guard + param parsing, then call `computeSchemeReturns({ toDate: toDateRaw, plan, option, q })` and return its result (plus `activeFilters`) as JSON. Delete the now-duplicated helpers/loop from the route.

- [ ] **Step 5: Run tests**

Run: `npm test tests/reports/navPerformance.test.ts`
Expected: `OK navPerformance`.
Then smoke-test the unchanged route:
```bash
npm run dev
# in another shell:
curl -s "http://localhost:3000/api/admin/nav-records?toDate=2026-06-30&plan=Regular" | head -c 200
```
Expected: same JSON shape as before (schemes/categoryAverages/top3/bottom3/total/toDate/activeFilters). (Requires an authenticated session cookie; if 403, verify via the admin UI instead — the page must still render identically.)

- [ ] **Step 6: Commit**
```bash
git add src/lib/reports/navPerformance.ts src/app/api/admin/nav-records/route.ts tests/reports/navPerformance.test.ts
git commit -m "refactor(report): extract shared NAV compute + report grouping"
```

---

## Task 5: AI prose layer (with deterministic fallback)

**Files:**
- Create: `src/lib/reports/aiProse.ts`
- Test: `tests/reports/aiProse.test.ts` (tests the fallback path only — no network)

**Interfaces:**
- Consumes: `UniverseData`, `PerformanceData`, `Prose` from `types.ts`; `AISetting` model.
- Produces:
  - `fallbackProse(monthLabel, universe, perf): Prose` — deterministic string templates.
  - `generateProse(monthLabel, universe, perf): Promise<Prose>` — uses `AISetting` tagged `monthly-report`, falls back on any error/missing setting.

- [ ] **Step 1: Write the failing test**

Create `tests/reports/aiProse.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test tests/reports/aiProse.test.ts`
Expected: FAIL — cannot find `@/lib/reports/aiProse`.

- [ ] **Step 3: Implement**

Create `src/lib/reports/aiProse.ts`:
```ts
import { connectDB } from "@/lib/mongodb";
import AISetting from "@/models/AISetting";
import type { UniverseData, PerformanceData, Prose } from "./types";

function inCr(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fallbackProse(monthLabel: string, u: UniverseData, perf: PerformanceData): Prose {
  const g = u.grandTotal;
  const cats = u.categories.length || 6;
  return {
    universeOverview:
      `As of ${monthLabel}, the SIF universe comprised ${g.schemes} active schemes across ${cats} categories ` +
      `with net AUM of ₹${inCr(g.aumCr)} Cr and ${g.folios.toLocaleString("en-IN")} investor folios, ` +
      `recording net inflows of ₹${inCr(g.netFlowCr)} Cr for the month.`,
    debtSectionNote:
      `No Debt Long-Short SIF schemes have been launched as of ${monthLabel}. ` +
      `This table will be populated once schemes become active on the SIFcase platform.`,
    highlightsIntro:
      `All returns computed from NAV history on the SIFcase platform. ` +
      `Returns are absolute given the short track record of the SIF framework.`,
  };
}

const PROMPT = `You are a SEBI-registered SIF research analyst. Using ONLY the JSON figures given, write three fields as JSON:
- "universeOverview": one sentence like the reference — must state the exact scheme count, category count (6), net AUM (₹ Cr), folio count, and net inflow (₹ Cr) from the data. Do not invent any number.
- "debtSectionNote": one/two sentences noting no Debt Long-Short SIF schemes exist as of the given month, populated when schemes go live.
- "highlightsIntro": one/two neutral sentences introducing the monthly performance highlights (returns are absolute, computed from NAV history).
Return strict JSON with exactly these keys.`;

export async function generateProse(monthLabel: string, u: UniverseData, perf: PerformanceData): Promise<Prose> {
  const fb = fallbackProse(monthLabel, u, perf);
  try {
    await connectDB();
    const setting = await AISetting.findOne({ usages: "monthly-report" }).lean();
    if (!setting) return fb;

    const payload = {
      monthLabel,
      grandTotal: { schemes: u.grandTotal.schemes, categories: 6, netAumCr: u.grandTotal.aumCr, folios: u.grandTotal.folios, netInflowCr: u.grandTotal.netFlowCr },
      topPerformers: perf.top3.map((r) => ({ name: r.schemeName, oneMonth: r.r1m })),
    };
    const prompt = `${PROMPT}\n\n=== DATA (JSON) ===\n${JSON.stringify(payload)}`;

    let out: Partial<Prose> = {};
    if (setting.provider === "gemini") {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const { generateText } = await import("ai");
      const google = createGoogleGenerativeAI({ apiKey: setting.apiKey });
      const { text } = await generateText({ model: google(setting.modelName), prompt, temperature: 0.2 });
      out = parseJson(text);
    } else if (setting.provider === "deepseek") {
      out = await callDeepSeek(prompt, setting.modelName, setting.apiKey);
    } else if (setting.provider === "openrouter") {
      out = await callOpenRouter(prompt, setting.modelName, setting.apiKey);
    }
    return {
      universeOverview: out.universeOverview?.trim() || fb.universeOverview,
      debtSectionNote: out.debtSectionNote?.trim() || fb.debtSectionNote,
      highlightsIntro: out.highlightsIntro?.trim() || fb.highlightsIntro,
    };
  } catch {
    return fb; // never fail the report because of AI
  }
}

function parseJson(text: string): Partial<Prose> {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { return {}; }
}

async function callDeepSeek(prompt: string, model: string, apiKey: string): Promise<Partial<Prose>> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2, response_format: { type: "json_object" } }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "DeepSeek error");
  return parseJson(d.choices[0].message.content);
}

async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<Partial<Prose>> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": "https://sifcase.in", "X-Title": "SIFcase Admin" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || "OpenRouter error");
  return parseJson(d.choices[0].message.content);
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test tests/reports/aiProse.test.ts`
Expected: `OK aiProse fallback`.

- [ ] **Step 5: Commit**
```bash
git add src/lib/reports/aiProse.ts tests/reports/aiProse.test.ts
git commit -m "feat(report): AI prose layer with deterministic fallback"
```

---

## Task 6: Build the tagged template docx

**Files:**
- Create: `scripts/build-report-template.ts`
- Create: `src/reports/monthly-template.docx` (generated output, committed)

**Interfaces:**
- Consumes: `SIF_Monthly_Report_Jun2026.docx` (reference, in repo root).
- Produces: `src/reports/monthly-template.docx` with docxtemplater tags — the render contract used by Task 7.

**Tag contract (Task 7 fills exactly these):**

| Location in doc | Tag(s) |
|---|---|
| Cover subtitle / dates | `{monthLabel}`, `{asOfLong}` |
| Snapshot cards | `{universe.grandTotal.schemes}`, `{aumCrRounded}`, `{netFlowCrRounded}`, `{universe.grandTotal.folios}`, `{asOfShort}` |
| §02 overview paragraph | `{prose.universeOverview}` |
| §02 Category breakdown rows | loop `{#universe.categories}` … `{label}`/`{schemes}`/`{aumCr}`/`{folios}`/`{grossInflowCr}`/`{netFlowCr}` … `{/universe.categories}` + grand-total row `{universe.grandTotal.*}` |
| §02 NSR rows | loop `{#universe.nsr.rows}` `{schemeNames}`/`{category}`/`{count}`/`{mobilisedCr}` `{/universe.nsr.rows}` |
| §04C Debt note | `{prose.debtSectionNote}` |
| §03C Equity perf rows | loop `{#perf.equity}` `{schemeName}`/`{shortCategory}`/`{amc}`/`{r1m}`/`{r3m}`/`{r6m}`/`{r1y}`/`{si}`/`{since}` `{/perf.equity}` |
| §05C Hybrid perf rows | loop `{#perf.hybrid}` (same cell tags) `{/perf.hybrid}` |
| §06 highlights intro | `{prose.highlightsIntro}` |
| §06 Top3 rows | loop `{#perf.top3}` `{schemeName}`/`{shortCategory}`/`{amc}`/`{r1m}`/`{si}` `{/perf.top3}` |
| §06 Bottom3 rows | loop `{#perf.bottom3}` (same) `{/perf.bottom3}` |
| §07 Comprehensive rows | loop `{#perf.comprehensive}` (same as equity cell tags) `{/perf.comprehensive}` |
| All other month literals ("June 2026", "Jun 2026", "30th Jun 2026", "Jun 30, 2026") | `{monthLabel}` / `{monthShort}` / `{asOfLong}` / `{asOfShort}` |

**Percent cell tags** (`{r1m}` etc.) receive **pre-formatted strings** from Task 7 (e.g. `"+1.28%"`, `"-"`), so the template just prints them.

- [ ] **Step 1: Write the template builder script**

Create `scripts/build-report-template.ts`. It unzips the reference docx, edits `word/document.xml`, and writes the tagged template. Because tables need loop tags inside specific `<w:tr>` rows, the script does targeted, verified replacements and **fails loudly** if any anchor string is missing (so drift is caught):
```ts
import PizZip from "pizzip";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "SIF_Monthly_Report_Jun2026.docx");
const OUT_DIR = join(process.cwd(), "src/reports");
const OUT = join(OUT_DIR, "monthly-template.docx");

const zip = new PizZip(readFileSync(SRC));
let xml = zip.file("word/document.xml")!.asText();

function replaceAll(anchor: string, replacement: string) {
  if (!xml.includes(anchor)) throw new Error(`anchor not found: ${anchor.slice(0, 60)}`);
  xml = xml.split(anchor).join(replacement);
}

// NOTE: Word may split a visible string across multiple <w:t> runs. Inspect the
// XML first (see Step 2) and use the smallest reliably-contiguous run text as the
// anchor. Month literals that live in their own run are safe to swap globally.
// 1) Month literals (only the ones that appear as whole runs):
replaceAll("30th Jun 2026", "{asOfLong}");
replaceAll("Jun 30, 2026", "{asOfShort}");
// "June 2026" and "Jun 2026" appear many times — swap each contiguous run:
xml = xml.replace(/June 2026/g, "{monthLabel}");
xml = xml.replace(/Jun 2026/g, "{monthShort}");

// 2..N) Table loop tags + prose tags are inserted by hand-verified anchors below.
// (Filled in during Step 3 after inspecting the XML.)

zip.file("word/document.xml", xml);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, zip.generate({ type: "nodebuffer" }));
console.log("wrote", OUT);
```

- [ ] **Step 2: Inspect the document XML to find loop-row anchors**

Run:
```bash
node -e "const P=require('pizzip');const fs=require('fs');const z=new P(fs.readFileSync('SIF_Monthly_Report_Jun2026.docx'));fs.writeFileSync('/tmp/document.xml', z.file('word/document.xml').asText());"
```
Open `/tmp/document.xml`. For each dynamic table, locate the `<w:tr>` that holds the **first data row** (e.g. the "Equity Long-Short | 9 | 2,225.36 | …" row). You will wrap that row's opening with `{#universe.categories}` and replace the closing of the last data row region — practically: put `{#universe.categories}` at the start of the first data `<w:tr>` (inside its first cell text) and `{/universe.categories}` at the end of that same `<w:tr>`'s last cell, then **delete the remaining hard-coded data rows** so only the single loop row remains. Replace that row's cell texts with the cell tags from the Tag Contract.

- [ ] **Step 3: Extend the script with the verified table/prose replacements**

For each dynamic region, add `replaceAll(<exact single-row XML snippet copied from Step 2>, <same snippet with cell text swapped for tags and the row wrapped in {#loop}/{/loop}>)`, and remove the sibling hard-coded rows. Do the same for the prose paragraphs (`{prose.universeOverview}`, `{prose.debtSectionNote}`, `{prose.highlightsIntro}`) and the snapshot cards. Also delete the `<w:drawing>` blocks for the page-2 Market Snapshot images and the §02 category charts (leave the surrounding heading/caption paragraphs).

Keep every `replaceAll` guarded so a missing anchor throws.

- [ ] **Step 4: Generate the template**

Run:
```bash
npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/build-report-template.ts
```
Expected: `wrote …/src/reports/monthly-template.docx`, no "anchor not found" error.

- [ ] **Step 5: Sanity-open the template**

Open `src/reports/monthly-template.docx` in Word/Pages. Confirm: all fixed SEBI/disclaimer text intact; dynamic tables show a single row of `{tags}`; page-2 and category-chart image areas are empty; month literals show as `{monthLabel}` etc. (It will look "broken" where tags are — that's correct.)

- [ ] **Step 6: Commit**
```bash
git add scripts/build-report-template.ts src/reports/monthly-template.docx
git commit -m "feat(report): build tagged docx template from reference report"
```

---

## Task 7: Render + orchestrate

**Files:**
- Create: `src/lib/reports/renderDocx.ts`
- Create: `src/lib/reports/buildReportData.ts`
- Test: `tests/reports/renderDocx.test.ts`

**Interfaces:**
- Consumes: `ReportModel` (types.ts), the template docx, `fetchUniverse`, `computeReportPerformance`, `generateProse`, `monthMetaFromDate`.
- Produces:
  - `renderReport(model: ReportModel): Buffer`.
  - `buildReportModel(toDate: string): Promise<ReportModel>`.
  - `reportFileName(toDate: string): string` → `SIF_Monthly_Report_Jun2026.docx`.

- [ ] **Step 1: Write the failing test**

Create `tests/reports/renderDocx.test.ts`:
```ts
import assert from "node:assert/strict";
import PizZip from "pizzip";
import { renderReport } from "@/lib/reports/renderDocx";
import type { ReportModel } from "@/lib/reports/types";

const model: ReportModel = {
  monthLabel: "June 2026", monthShort: "Jun 2026", asOfLong: "30th Jun 2026", asOfShort: "Jun 30, 2026", year: 2026,
  universe: {
    monthLabel: "June 2026",
    categories: [
      { key: "equity_ls", label: "Equity Long-Short", schemes: 9, aumCr: 2225.36, folios: 14841, grossInflowCr: 433.94, netFlowCr: 333.20 },
    ],
    grandTotal: { key: "grand_total", label: "Grand Total", schemes: 27, aumCr: 17857.77, folios: 75032, grossInflowCr: 4166.94, netFlowCr: 3781.96 },
    nsr: { rows: [{ category: "Equity Long-Short", schemeNames: "iSIF Equity Long-Short Fund", count: 1, mobilisedCr: 212 }], totalSchemes: 6, totalMobilisedCr: 1740 },
  },
  perf: {
    equity: [{ schemeName: "qsif Equity Long Short Fund", category: "Equity Long-Short", shortCategory: "Equity L-S", amc: "qsif SIF", r1m: "+2.43%", r3m: "+18.57%", r6m: "+5.31%", r1y: "-", si: "+5.07%", since: "Oct-25" } as any],
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test tests/reports/renderDocx.test.ts`
Expected: FAIL — cannot find `@/lib/reports/renderDocx`.

- [ ] **Step 3: Implement renderDocx**

Create `src/lib/reports/renderDocx.ts`:
```ts
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReportModel } from "./types";

const TEMPLATE = join(process.cwd(), "src/reports/monthly-template.docx");

export function renderReport(model: ReportModel): Buffer {
  const zip = new PizZip(readFileSync(TEMPLATE));
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "{", end: "}" } });
  doc.render({
    ...model,
    // convenience rounded snapshot values:
    aumCrRounded: Math.round(model.universe.grandTotal.aumCr).toLocaleString("en-IN"),
    netFlowCrRounded: Math.round(model.universe.grandTotal.netFlowCr).toLocaleString("en-IN"),
  });
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test tests/reports/renderDocx.test.ts`
Expected: `OK renderDocx`. If it throws "Multi error" from docxtemplater, the message lists unresolved/misnested tags in the template — fix the template (Task 6) and regenerate.

- [ ] **Step 5: Implement the orchestrator**

Create `src/lib/reports/buildReportData.ts`:
```ts
import { monthMetaFromDate } from "./monthMeta";
import { fetchUniverse } from "./amfiUniverse";
import { computeReportPerformance } from "./navPerformance";
import { generateProse } from "./aiProse";
import type { ReportModel, PerfRow, PerformanceData } from "./types";

function pct(v: number | null): string {
  if (v === null) return "-";
  const s = v >= 0 ? "+" : "";
  return `${s}${v.toFixed(2)}%`;
}
// Convert numeric PerfRow returns to display strings the template prints verbatim.
function fmtRows(rows: PerfRow[]): Record<string, unknown>[] {
  return rows.map((r) => ({
    schemeName: r.schemeName, shortCategory: r.shortCategory, amc: r.amc, since: r.since ?? "—",
    r1m: pct(r.r1m), r3m: pct(r.r3m), r6m: pct(r.r6m), r1y: pct(r.r1y), si: pct(r.si),
  }));
}

export async function buildReportModel(toDate: string): Promise<ReportModel> {
  const meta = monthMetaFromDate(toDate);
  const [universe, perfRaw] = await Promise.all([fetchUniverse(toDate), computeReportPerformance(toDate)]);
  const prose = await generateProse(meta.monthLabel, universe, perfRaw);

  const perf = {
    equity: fmtRows(perfRaw.equity), hybrid: fmtRows(perfRaw.hybrid), debt: fmtRows(perfRaw.debt),
    comprehensive: fmtRows(perfRaw.comprehensive), top3: fmtRows(perfRaw.top3), bottom3: fmtRows(perfRaw.bottom3),
    totals: perfRaw.totals,
  } as unknown as PerformanceData;

  // Pre-format universe numbers for display (commas + 2dp) without losing the raw model shape.
  const fmtCat = (c: typeof universe.categories[number]) => ({
    ...c,
    aumCr: c.aumCr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    folios: c.folios.toLocaleString("en-IN"),
    grossInflowCr: c.grossInflowCr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    netFlowCr: (c.netFlowCr >= 0 ? "+" : "") + c.netFlowCr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  });
  const universeFmt = {
    ...universe,
    categories: universe.categories.map(fmtCat) as unknown as typeof universe.categories,
    grandTotal: fmtCat(universe.grandTotal) as unknown as typeof universe.grandTotal,
    nsr: { ...universe.nsr, rows: universe.nsr.rows.map((r) => ({ ...r, mobilisedCr: r.mobilisedCr.toLocaleString("en-IN") })) as unknown as typeof universe.nsr.rows },
  };

  return {
    monthLabel: meta.monthLabel, monthShort: meta.monthShort, asOfLong: meta.asOfLong, asOfShort: meta.asOfShort, year: meta.year,
    universe: universeFmt, perf, prose,
  };
}

export function reportFileName(toDate: string): string {
  const meta = monthMetaFromDate(toDate);
  return `SIF_Monthly_Report_${meta.fileMon}${meta.year}.docx`;
}
```
Note: raw AUM for the snapshot cards (`aumCrRounded`) is computed in `renderDocx` from `grandTotal.aumCr`; since `buildReportModel` now stringifies `aumCr`, move the snapshot rounding into `buildReportModel` instead — add `snapshotAum` / `snapshotNetFlow` fields to the model from the numeric values **before** stringifying, and reference those tags in the template. Update `types.ts` `ReportModel` with `snapshotAum: string; snapshotNetFlow: string;` and the template snapshot card tags to `{snapshotAum}` / `{snapshotNetFlow}`. (Keeps numbers correct after formatting.)

- [ ] **Step 6: Adjust for the snapshot-number ordering**

Apply the note above: in `types.ts` add `snapshotAum: string; snapshotNetFlow: string;` to `ReportModel`; in `buildReportModel` set them from the numeric `universe.grandTotal` **before** `fmtCat` stringifies; in `renderDocx` drop the `aumCrRounded`/`netFlowCrRounded` computation; in the template use `{snapshotAum}` / `{snapshotNetFlow}` for the snapshot cards. Re-run Task 6 Step 4 to regenerate the template if you changed snapshot tags.

- [ ] **Step 7: Commit**
```bash
git add src/lib/reports/renderDocx.ts src/lib/reports/buildReportData.ts src/lib/reports/types.ts src/reports/monthly-template.docx tests/reports/renderDocx.test.ts
git commit -m "feat(report): render template + orchestrate report data"
```

---

## Task 8: API route + client button

**Files:**
- Create: `src/app/api/admin/nav-records/report/route.ts`
- Modify: `src/app/admin/nav-records/page.tsx`
- Modify: `src/app/admin/settings/AISettingsClient.tsx` (only if usages are a fixed list)

**Interfaces:**
- Consumes: `buildReportModel`, `renderReport`, `reportFileName`, `hasAnyPageAccess`.

- [ ] **Step 1: Implement the route**

Create `src/app/api/admin/nav-records/report/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { hasAnyPageAccess } from "@/lib/adminAuth";
import { buildReportModel, reportFileName } from "@/lib/reports/buildReportData";
import { renderReport } from "@/lib/reports/renderDocx";

const ALLOWED_PAGES = ["funds", "schemes"];

export async function POST(req: NextRequest) {
  if (!(await hasAnyPageAccess(req, ALLOWED_PAGES, "view"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let toDate = "";
  try {
    const body = await req.json();
    toDate = String(body.toDate || "");
  } catch { /* fallthrough */ }
  if (!toDate) return NextResponse.json({ error: "toDate required" }, { status: 400 });

  try {
    const model = await buildReportModel(toDate);
    const buf = renderReport(model);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${reportFileName(toDate)}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Report generation failed";
    const status = /AMFI/.test(msg) ? 502 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
```

- [ ] **Step 2: Add the button + handler to the page**

In `src/app/admin/nav-records/page.tsx`:
1. Add state near the other `useState`s: `const [reporting, setReporting] = useState(false);`
2. Add the handler next to `downloadCSV`:
```tsx
async function downloadReport() {
  setReporting(true);
  try {
    const res = await fetch(`/api/admin/nav-records/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toDate, plan, option }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Report failed");
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const name = /filename="([^"]+)"/.exec(cd)?.[1] || `SIF_Monthly_Report.docx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(e instanceof Error ? e.message : "Report generation failed");
  } finally {
    setReporting(false);
  }
}
```
3. Add the button immediately before the Download CSV `<button>` (same header action row):
```tsx
<button
  onClick={downloadReport}
  disabled={reporting || loading}
  className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-primary text-primary text-[13px] font-semibold hover:bg-primary/5 disabled:opacity-60 transition-colors"
>
  {reporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
  {reporting ? "Building…" : "Download Report"}
</button>
```

- [ ] **Step 3: Register the `monthly-report` AI usage (conditional)**

Open `src/app/admin/settings/AISettingsClient.tsx`. If usage tags come from a hard-coded list, add `"monthly-report"` to it so the tag is selectable. If usages are free-text, skip this step and just tag a setting `monthly-report` via the UI.

- [ ] **Step 4: Verify end-to-end**

Run:
```bash
npm run dev
```
In the admin UI: open `/admin/nav-records`, set **As Of Date** to `2026-06-30`, click **Download Report**. Expected: `SIF_Monthly_Report_Jun2026.docx` downloads. Open it and compare against the reference `SIF_Monthly_Report_Jun2026.docx`:
- Universe table, NSR table, performance tables filled with correct numbers.
- SEBI text / allocation ranges / disclaimer identical.
- Page-2 and category-chart areas empty.
- Overview / debt-note / highlights sentences present.

Then verify a different month resolves its own AMFI PDF: set As Of Date to `2026-05-31` and confirm the download names `SIF_Monthly_Report_May2026.docx` and pulls May figures (or returns a clear 502 if AMFI has no May file).

- [ ] **Step 5: Run the full test suite**
```bash
for f in tests/reports/*.test.ts; do npm test "$f" || exit 1; done
```
Expected: all `OK …` lines, no failures.

- [ ] **Step 6: Commit**
```bash
git add src/app/api/admin/nav-records/report/route.ts src/app/admin/nav-records/page.tsx src/app/admin/settings/AISettingsClient.tsx
git commit -m "feat(report): add Download Report button + report API route"
```

---

## Self-Review Notes

- **Spec coverage:** month resolve (Task 1), AMFI parse+reconcile (Task 2), AMFI fetch/pdfjs (Task 3), NAV grouping + route refactor (Task 4), AI prose + fallback (Task 5), exact-clone template with empty charts (Task 6), render + orchestrate (Task 7), route + button + filename + error handling (Task 8). All spec sections mapped.
- **Number formatting:** raw numeric values are used for parsing/reconciliation/AI; display strings (commas, `%`, `+`) are applied only in `buildReportModel`/`renderDocx` so the template prints verbatim. Snapshot AUM/net-flow rounding is taken from numeric values before stringifying (Task 7 Step 6).
- **Type consistency:** `PerfRow` numeric returns become display strings via `fmtRows`; the template's `perf.*` cell tags therefore receive strings. `renderReport` accepts the `ReportModel` produced by `buildReportModel` (with stringified fields cast through the same types).
- **Risk:** pdfjs line reconstruction vs the pdftotext fixture — mitigated by the Task 3 integration test on the real PDF and the runtime reconciliation guard.
