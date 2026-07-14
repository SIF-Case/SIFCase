# SIF Monthly Report — Word (.docx) Download

**Date:** 2026-07-14
**Status:** Approved design → implementation planning
**Owner:** Roshan

## Goal

Add a **Download Report** button beside **Download CSV** on `/admin/nav-records`.
It generates a Word document that is a byte-for-byte-faithful clone of the reference
report `SIF_Monthly_Report_Jun2026.docx` — same fonts, theme, header/footer, SEBI
regulatory text, allocation ranges, and disclaimer — with the **month-specific data**
filled in for the month selected in the page's *As Of Date* filter.

The generated file downloads as `SIF_Monthly_Report_<Mon><Year>.docx`
(e.g. `SIF_Monthly_Report_Jun2026.docx`).

## Non-goals

- Rendering the page-2 Market Snapshot charts (NSE data) — left **empty**, user pastes manually.
- Rendering the section-02 category charts (AUM / Schemes / Folios by category) —
  left as **empty placeholders**, user pastes manually.
- PDF output (the existing `PerformanceReport.pdfUrl` flow is untouched).
- Editing / persisting the generated report to the DB.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Generation technique | `docxtemplater` templating the **real** `.docx` (exact clone) |
| Fixed SEBI / disclaimer / ranges text | **Cloned from template, untouched** — never AI-generated |
| AMFI universe numbers | **Deterministic parse** of the AMFI monthly PDF (no AI on numbers) |
| Category graphs & page 2 | **Left empty** for manual paste |
| AI role | Writes **only** the month-varying prose sentences |
| AI provider | Whichever `AISetting` is tagged `monthly-report` (gemini or deepseek) |
| Month source | Derived from the page's *As Of Date* filter |

## Data sources

1. **AMFI SIF monthly PDF** — `https://portal.amfiindia.com/spages/sif_am<mon><yyyy>repo.pdf`
   - `<mon>` = lowercase 3-letter month (`jan`…`dec`), `<yyyy>` = 4-digit year.
   - Jun 2026 → `sif_amjun2026repo.pdf` (verified: HTTP 200, 132 KB, clean fixed-layout table).
   - Provides the **category breakdown** (No. of Schemes, Folios, Funds Mobilized/Gross,
     Net Inflow, Net AUM) and the **New Schemes Report (NSR)** table.
   - Every number maps 1:1 to the reference report's Universe table & NSR table.
2. **NAV performance** — computed from `SIFNav` / `SIFScheme` via the logic currently
   inside `src/app/api/admin/nav-records/route.ts` (returns 1M/3M/6M/1Y/SI per scheme).
3. **AI prose** — `AISetting` model (existing), provider call pattern reused from
   `src/app/api/admin/fund-details/generate-narrative/route.ts`.

## Architecture

```
page.tsx  ── Download Report ──►  POST /api/admin/nav-records/report {toDate, plan, option}
                                        │
                                        ▼
                          lib/reports/buildReportData.ts (orchestrator)
                             ├─ amfiUniverse.ts     → universe table + NSR (deterministic)
                             ├─ navPerformance.ts   → grouped performance tables
                             └─ aiProse.ts          → month-varying sentences
                                        │
                                        ▼
                          lib/reports/renderDocx.ts (docxtemplater + pizzip)
                             uses src/reports/monthly-template.docx
                                        │
                                        ▼
                          .docx Buffer ──► download in browser
```

### New files

| File | Responsibility |
|---|---|
| `src/reports/monthly-template.docx` | The reference `.docx` with `{tags}`/`{#loops}` inserted, manual images stripped. Server-only asset. |
| `src/lib/reports/amfiUniverse.ts` | Fetch AMFI PDF, extract text (`pdfjs-dist`), parse category + NSR rows, reconcile totals. |
| `src/lib/reports/navPerformance.ts` | Shared NAV compute (refactored out of the route), grouped for the report. |
| `src/lib/reports/aiProse.ts` | Select `monthly-report` `AISetting`, generate prose, deterministic fallback. |
| `src/lib/reports/buildReportData.ts` | Orchestrate the three sources into the template data model. |
| `src/lib/reports/renderDocx.ts` | Render template → `.docx` Buffer. |
| `src/app/api/admin/nav-records/report/route.ts` | `POST` endpoint: auth → build → render → return `.docx`. |

### Changed files

| File | Change |
|---|---|
| `src/app/admin/nav-records/page.tsx` | Add **Download Report** button + `downloadReport()` handler (mirrors `downloadCSV`). |
| `src/app/api/admin/nav-records/route.ts` | Extract compute into `navPerformance.ts`; import it back so behaviour is unchanged. |
| `package.json` | Add `docxtemplater`, `pizzip`, `pdfjs-dist`. |
| `src/app/admin/settings/AISettingsClient.tsx` (if usages are a fixed list) | Add `monthly-report` to the selectable usage tags. |

## Module contracts

### `amfiUniverse.ts`
```ts
type UniverseCategory = {
  key: "equity_ls" | "equity_ex100_ls" | "sector_rotation_ls"
     | "debt_ls" | "aaa_ls" | "hybrid_ls";
  label: string;      // "Equity Long-Short"
  schemes: number;
  aumCr: number;      // Net AUM (INR crore)
  folios: number;
  grossInflowCr: number;
  netFlowCr: number;
};
type NsrScheme = { category: string; schemeNames: string; count: number; mobilisedCr: number };
type UniverseData = {
  monthLabel: string;                 // "June 2026"
  categories: UniverseCategory[];     // 6 rows, fixed order matching the report
  grandTotal: UniverseCategory;       // key aggregate
  nsr: { rows: NsrScheme[]; totalSchemes: number; totalMobilisedCr: number };
};
async function fetchUniverse(month: { mon: string; year: number }): Promise<UniverseData>;
```
Parsing rules:
- Extract page text with `pdfjs-dist` (legacy build), group items into lines by
  y-coordinate, sort by x.
- Locate each category by its known scheme name; read the trailing numeric sequence in
  the AMFI column order: `Schemes, Folios, Mobilized, Repurchase, NetInflow, NetAUM, AvgAUM, …`.
- **Reconcile:** sub-totals (I/II/III) must sum to grand total; throw a descriptive
  error if reconciliation fails (guards against layout changes).

### `navPerformance.ts`
```ts
type PerfRow = {
  schemeName: string; category: string; shortCategory: string; amc: string;
  r1m: number|null; r3m: number|null; r6m: number|null; r1y: number|null; si: number|null;
  since: string|null;               // "May-26"
};
type PerformanceData = {
  equity: PerfRow[]; hybrid: PerfRow[]; debt: PerfRow[];
  comprehensive: PerfRow[];         // all, alphabetical
  top3: PerfRow[]; bottom3: PerfRow[];
  totals: { schemes: number; positive: number; negative: number };
};
async function computePerformance(opts: {
  toDate: string; plan: string; option: string;
}): Promise<PerformanceData>;
```
- One canonical row per scheme (default `Regular` · `Growth`) so the count aligns with
  the AMFI scheme total.
- `shortCategory` maps strategy → report label (`Equity L-S`, `Ex-100 L-S`, `AAA L-S`,
  `Hybrid L-S`, `Sector R L-S`).

### `aiProse.ts`
```ts
type ProseInput = { monthLabel: string; universe: UniverseData; perf: PerformanceData };
type Prose = {
  universeOverview: string;   // "As of June 2026, the SIF universe comprised 27 active schemes…"
  debtSectionNote: string;    // "No Debt Long-Short SIF schemes have been launched as of June 2026…"
  highlightsIntro: string;    // monthly-highlights intro
};
async function generateProse(input: ProseInput): Promise<Prose>;
```
- Selects `AISetting` where `usages` includes `"monthly-report"`.
- Numbers are supplied in the prompt; temperature low (0.2); instruct "use the exact
  figures given, do not invent".
- **Fallback:** if no such `AISetting`, return deterministic string-template prose so the
  report always renders.

### `renderDocx.ts`
```ts
function renderReport(data: ReportModel): Buffer;   // ReportModel = universe + perf + prose + labels
```
- Load `monthly-template.docx` from disk (`path.join(process.cwd(), "src/reports/monthly-template.docx")`).
- `PizZip` → `Docxtemplater` with `paragraphLoop: true, linebreaks: true`.
- Render with the data model; return `zip.generate({ type: "nodebuffer" })`.

### API route
`POST /api/admin/nav-records/report`
- Body: `{ toDate, plan, option }`.
- `hasPageAccess` guard (same as sibling routes).
- Returns the buffer with headers:
  `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
  `Content-Disposition: attachment; filename="SIF_Monthly_Report_<Mon><Year>.docx"`.

### Client handler
`downloadReport()` mirrors `downloadCSV()`: POST current `{toDate, plan, option}`, read
blob, trigger download, `reporting`/`setReporting` loading state, error toast on failure.

## Template preparation (the exacting part)

Convert `SIF_Monthly_Report_Jun2026.docx` → `src/reports/monthly-template.docx`:

1. Replace all month literals with tags: `{monthLabel}` ("June 2026"),
   `{monthShort}` ("Jun 2026"), `{asOfLong}` ("30th Jun 2026"),
   `{asOfShort}` ("Jun 30, 2026"), `{year}`.
2. Snapshot cards (Total Schemes / AUM / Net Inflows / Folios) → tags.
3. Universe **Category-wise Breakdown** table → row loop `{#universe.categories}…{/universe.categories}`
   + grand-total row from `{universe.grandTotal.*}`.
4. **NSR** table → row loop `{#universe.nsr.rows}`.
5. Performance tables (Equity §03C, Hybrid §05C, comprehensive §07, top3/bottom3 §06) →
   row loops over the corresponding `perf.*` arrays.
6. Prose paragraphs → `{prose.universeOverview}`, `{prose.debtSectionNote}`,
   `{prose.highlightsIntro}`.
7. **Strip the manual images:** remove the page-2 Market Snapshot images and the
   section-02 category-chart images, leaving the surrounding headings/captions so the
   layout/space remains for manual paste.
8. Leave **all** other runs (SEBI strategy text, allocation-range tables, disclaimer,
   header/footer, styles, theme) **untouched**.

Template building is done by editing `word/document.xml` inside the docx zip directly
(tags are plain text runs), preserving every other part byte-for-byte.

## Error handling

- AMFI PDF fetch non-200 or reconciliation failure → route returns `502` with a clear
  message ("AMFI report for <Month> unavailable or format changed"); the button surfaces it.
- No `monthly-report` AISetting → prose falls back to deterministic templates (no failure).
- Template render error → `500` with the docxtemplater error summary.
- Month with no NAV data → tables render empty with the existing "insufficient data" copy.

## Testing

- **`amfiUniverse` parse:** unit test against the saved Jun-2026 PDF text fixture →
  assert Grand Total `27 / 75,032 / 4,166.94 / 3,781.96 / 17,857.77` and NSR `6 / 1,740`.
- **Reconciliation guard:** feed a mutated fixture (broken sub-total) → expect throw.
- **`navPerformance`:** assert grouping counts and that top3/bottom3 match the API's.
- **`renderDocx`:** render with fixture data → unzip → assert key strings present and
  that SEBI/disclaimer text is byte-identical to the template (no drift).
- **End-to-end:** hit the route for `2026-06-30`, open the `.docx`, eyeball against the
  reference `SIF_Monthly_Report_Jun2026.docx`.

## Open risks

- **`pdfjs-dist` column reconstruction** for the AMFI table is the trickiest piece;
  mitigated by the totals-reconciliation guard and a saved fixture.
- **Vercel bundling** of the `.docx` template and `pdfjs` worker — ensure the template is
  included in the serverless bundle (import as asset / `includeFiles`), and use the
  `pdfjs-dist` legacy build with the worker disabled (`useWorkerFetch:false`, no worker).
