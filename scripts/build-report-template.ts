/**
 * build-report-template.ts
 *
 * Converts the approved reference report `SIF_Monthly_Report_Jun2026.docx`
 * (falling back to the "(1)" copy that ships in the repo) into a
 * docxtemplater template `src/reports/monthly-template.docx`.
 *
 * The template is IDENTICAL to the reference report except that every dynamic
 * slot (month literals, snapshot cards, prose paragraphs, and every dynamic
 * table's data rows) is replaced by a docxtemplater `{tag}` / `{#loop}` marker.
 * Task 7 renders this template with real data.
 *
 * Design rules honoured here:
 *  - Every edit is GUARDED: if an expected anchor is missing, we THROW, so
 *    silent drift against the reference doc is impossible.
 *  - Word splits visible strings across multiple <w:t> runs. Month literals are
 *    handled with exact multi-run anchors (see the cover / snapshot-card edits).
 *  - Table loops keep the header row + a single data "prototype" row wrapped in
 *    `{#loop}...{/loop}`; all sibling hard-coded data rows are deleted.
 *  - The page-2 Market Snapshot images and the §02 category-chart images are
 *    stripped; all other images/styles/theme/header/footer stay untouched.
 *
 * Run:
 *   npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register \
 *     scripts/build-report-template.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// pizzip ships no type declarations.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PizZip: any = require("pizzip");

const ROOT = process.cwd();
const SRC_PRIMARY = join(ROOT, "SIF_Monthly_Report_Jun2026.docx");
const SRC_FALLBACK = join(ROOT, "SIF_Monthly_Report_Jun2026 (1).docx");
const SRC = existsSync(SRC_PRIMARY) ? SRC_PRIMARY : SRC_FALLBACK;
const OUT_DIR = join(ROOT, "src/reports");
const OUT = join(OUT_DIR, "monthly-template.docx");

if (!existsSync(SRC)) {
  throw new Error(
    `source report not found: neither ${SRC_PRIMARY} nor ${SRC_FALLBACK} exist`,
  );
}
console.log("source:", SRC);

const zip = new PizZip(readFileSync(SRC));
let xml: string = zip.file("word/document.xml").asText();

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Replace every occurrence of `anchor`; throw if it is absent. */
function replaceAll(anchor: string, replacement: string): void {
  if (!xml.includes(anchor)) {
    throw new Error(`anchor not found: ${anchor.slice(0, 80)}`);
  }
  xml = xml.split(anchor).join(replacement);
}

/** Replace exactly one occurrence; throw if absent or ambiguous. */
function replaceOnce(anchor: string, replacement: string): void {
  const first = xml.indexOf(anchor);
  if (first === -1) throw new Error(`anchor not found: ${anchor.slice(0, 80)}`);
  if (xml.indexOf(anchor, first + anchor.length) !== -1) {
    throw new Error(`anchor not unique: ${anchor.slice(0, 80)}`);
  }
  xml = xml.slice(0, first) + replacement + xml.slice(first + anchor.length);
}

/**
 * Collapse a <w:tc> cell to a single paragraph and set its visible text to
 * `tag`. Keeps the cell's tcPr and the first paragraph's run formatting;
 * drops any extra paragraphs (e.g. multi-line NSR scheme-name cells) so the
 * rendered cell is a clean single line.
 */
function setCellText(tc: string, tag: string): string {
  const m = tc.match(/^(<w:tc>)(<w:tcPr>[\s\S]*?<\/w:tcPr>)?([\s\S]*)(<\/w:tc>)$/);
  if (!m) throw new Error(`cell shape unexpected: ${tc.slice(0, 60)}`);
  const inner = m[3];
  const pMatch = inner.match(/<w:p\b[\s\S]*?<\/w:p>/);
  if (!pMatch) throw new Error(`cell has no paragraph: ${tc.slice(0, 60)}`);
  let p = pMatch[0];
  if (!/<w:t\b/.test(p)) throw new Error(`cell has no text run: ${tc.slice(0, 60)}`);
  let first = true;
  p = p.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/g, () => {
    if (first) {
      first = false;
      return `<w:t xml:space="preserve">${tag}</w:t>`;
    }
    return "<w:t></w:t>";
  });
  return m[1] + (m[2] || "") + p + m[4];
}

/** All <w:tr> rows of the source, in document order (captured pre-mutation). */
const ROWS: string[] = (xml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || []);
if (ROWS.length !== 121) {
  throw new Error(`expected 121 table rows, found ${ROWS.length} (doc drifted)`);
}

function assertRow(idx: number, mustContain: string): string {
  const row = ROWS[idx];
  if (!row.includes(mustContain)) {
    throw new Error(`row ${idx} missing ${JSON.stringify(mustContain)} (doc drifted)`);
  }
  return row;
}

/**
 * Rebuild a data row's cells with the given tags (one per column). Cells beyond
 * `tags.length` are left untouched (there are none in practice).
 */
function tagifyRow(row: string, tags: string[]): string {
  const cells = row.match(/<w:tc\b[\s\S]*?<\/w:tc>/g);
  if (!cells) throw new Error("row has no cells");
  if (cells.length !== tags.length) {
    throw new Error(`row has ${cells.length} cells but ${tags.length} tags given`);
  }
  let out = row;
  cells.forEach((cell, i) => {
    out = out.replace(cell, setCellText(cell, tags[i]));
  });
  return out;
}

/** Replace a whole data row with a loop/tagged version; guarded + unique. */
function replaceRow(originalRow: string, newRow: string): void {
  replaceOnce(originalRow, newRow);
}

/** Delete a whole data row; guarded + unique. */
function deleteRow(originalRow: string): void {
  replaceOnce(originalRow, "");
}

/** Remove the single <w:drawing> block containing the given r:embed id. */
function stripDrawing(embedId: string): void {
  const re = new RegExp(
    `<w:drawing>(?:(?!<\\/w:drawing>)[\\s\\S])*?r:embed="${embedId}"(?:(?!<\\/w:drawing>)[\\s\\S])*?<\\/w:drawing>`,
  );
  if (!re.test(xml)) throw new Error(`drawing not found for embed ${embedId}`);
  const before = xml;
  xml = xml.replace(re, "");
  if (xml === before) throw new Error(`drawing strip no-op for embed ${embedId}`);
}

// ===========================================================================
// 1) COVER
// ===========================================================================

// Cover title "JUNE 2026" is split JUN + E + " 2026" across three sz=52 runs.
// The cover renders the month ALL-CAPS ("JUNE 2026"), so it uses a distinct
// {monthUpper} tag rather than the mixed-case {monthLabel} used in the body.
replaceOnce(
  `<w:r w:rsidRPr="00572EAD"><w:rPr><w:b/><w:bCs/><w:color w:val="1B7A5A"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr><w:t>JUN</w:t></w:r><w:r w:rsidR="00C33E8D"><w:rPr><w:b/><w:bCs/><w:color w:val="1B7A5A"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr><w:t>E</w:t></w:r><w:r w:rsidRPr="00572EAD"><w:rPr><w:b/><w:bCs/><w:color w:val="1B7A5A"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr><w:t xml:space="preserve"> 2026</w:t></w:r>`,
  `<w:r w:rsidRPr="00572EAD"><w:rPr><w:b/><w:bCs/><w:color w:val="1B7A5A"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr><w:t>{monthUpper}</w:t></w:r>`,
);

// Cover subtitle "...as of 30th Jun 2026 (Source: AMFI)." — asOfLong is split
// across "3","0","th"(superscript)," ","Jun"," 2026 ...".
replaceOnce(
  `<w:r w:rsidR="005A1D8D"><w:t xml:space="preserve"> The values are as of 3</w:t></w:r><w:r w:rsidR="001D785B"><w:t>0</w:t></w:r><w:r w:rsidR="001D785B"><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>th</w:t></w:r><w:r w:rsidR="005A1D8D"><w:t xml:space="preserve"> </w:t></w:r><w:r w:rsidR="008D5B47"><w:t>Jun</w:t></w:r><w:r w:rsidR="005A1D8D"><w:t xml:space="preserve"> 2026 (Source: AMFI). </w:t></w:r>`,
  `<w:r w:rsidR="005A1D8D"><w:t xml:space="preserve"> The values are as of {asOfLong} (Source: AMFI). </w:t></w:r>`,
);

// ===========================================================================
// 2) SNAPSHOT CARDS (page 1)
// ===========================================================================

// Card 1 — TOTAL SCHEMES value ("27"); paraId makes the anchor unique.
replaceOnce(
  `<w:t>27</w:t></w:r></w:p><w:p w14:paraId="51871BEC"`,
  `<w:t>{universe.grandTotal.schemes}</w:t></w:r></w:p><w:p w14:paraId="51871BEC"`,
);

// Card 2 — TOTAL AUM value + "as on Jun 30, 2026" subtitle (asOfShort split).
replaceOnce(`<w:t>₹17,858 Cr</w:t>`, `<w:t>{snapshotAum}</w:t>`);
replaceOnce(
  `<w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">as on </w:t></w:r><w:r w:rsidR="008D5B47"><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>Jun</w:t></w:r><w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> 3</w:t></w:r><w:r w:rsidR="008D5B47"><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>0</w:t></w:r><w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>, 2026</w:t></w:r>`,
  `<w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">as on {asOfShort}</w:t></w:r>`,
);

// Card 3 — NET INFLOWS value + "for Jun 2026" subtitle (monthShort split).
replaceOnce(`<w:t>₹3,782 Cr</w:t>`, `<w:t>{snapshotNetFlow}</w:t>`);
replaceOnce(
  `<w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">for </w:t></w:r><w:r w:rsidR="008D5B47"><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>Jun</w:t></w:r><w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> 2026</w:t></w:r>`,
  `<w:r><w:rPr><w:color w:val="7F8C8D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">for {monthShort}</w:t></w:r>`,
);

// Card 4 — FOLIOS value ("75,032"); paraId makes the anchor unique.
replaceOnce(
  `<w:t>75,032</w:t></w:r></w:p><w:p w14:paraId="4BA99E9A"`,
  `<w:t>{universe.grandTotal.folios}</w:t></w:r></w:p><w:p w14:paraId="4BA99E9A"`,
);

// ===========================================================================
// 3) PROSE PARAGRAPHS (single contiguous runs)
// ===========================================================================

replaceOnce(
  `<w:r><w:t>As of June 2026, the SIF universe comprised 27 active schemes across 6 categories with net AUM of ₹17,857.77 Cr and 75,032 investor folios, recording net inflows of ₹3,781.96 Cr for the month.</w:t></w:r>`,
  `<w:r><w:t>{prose.universeOverview}</w:t></w:r>`,
);

replaceOnce(
  `<w:r><w:t>All returns computed from NAV history on the SIFcase platform. Returns are absolute given the short track record of the SIF framework.</w:t></w:r>`,
  `<w:r><w:t>{prose.highlightsIntro}</w:t></w:r>`,
);

// §04C Debt note — 4 runs incl. split "Jun 2026"; collapse to one tag run.
replaceOnce(
  `<w:r><w:rPr><w:i/><w:iCs/><w:color w:val="E67E22"/></w:rPr><w:t xml:space="preserve">No Debt Long-Short SIF schemes have been launched as of </w:t></w:r><w:r w:rsidR="008D5B47"><w:rPr><w:i/><w:iCs/><w:color w:val="E67E22"/></w:rPr><w:t>Jun</w:t></w:r><w:r w:rsidR="00221F5C"><w:rPr><w:i/><w:iCs/><w:color w:val="E67E22"/></w:rPr><w:t xml:space="preserve"> 2026</w:t></w:r><w:r><w:rPr><w:i/><w:iCs/><w:color w:val="E67E22"/></w:rPr><w:t>. This table will be populated once schemes become active on the SIFcase platform.</w:t></w:r>`,
  `<w:r><w:rPr><w:i/><w:iCs/><w:color w:val="E67E22"/></w:rPr><w:t>{prose.debtSectionNote}</w:t></w:r>`,
);

// ===========================================================================
// 4) DYNAMIC TABLES — loop prototype rows + delete siblings
// ===========================================================================

// --- §02 Category breakdown (header row 3, data rows 4..9, grand total 10) ---
assertRow(3, "Gross Inflow");
{
  const proto = assertRow(4, "Equity Long-Short");
  replaceRow(
    proto,
    tagifyRow(proto, [
      "{#universe.categories}{label}",
      "{schemes}",
      "{aumCr}",
      "{folios}",
      "{grossInflowCr}",
      "{netFlowCr}{/universe.categories}",
    ]),
  );
  [5, 6, 7, 8, 9].forEach((i) => deleteRow(ROWS[i]));

  const gt = assertRow(10, "Grand Total");
  replaceRow(
    gt,
    tagifyRow(gt, [
      "{universe.grandTotal.label}",
      "{universe.grandTotal.schemes}",
      "{universe.grandTotal.aumCr}",
      "{universe.grandTotal.folios}",
      "{universe.grandTotal.grossInflowCr}",
      "{universe.grandTotal.netFlowCr}",
    ]),
  );
}

// --- §02 NSR (header row 11, data rows 12..15) ---
assertRow(11, "Mobilised");
{
  const proto = assertRow(12, "(2 schemes)");
  replaceRow(
    proto,
    tagifyRow(proto, [
      "{#universe.nsr.rows}{schemeNames}",
      "{category}",
      "{count}",
      "{mobilisedCr}{/universe.nsr.rows}",
    ]),
  );
  [13, 14, 15].forEach((i) => deleteRow(ROWS[i]));
}

// --- §02 NSR header fix: the AMC column actually holds a scheme {count}
// (AMFI NSR data has no AMC), so rename ONLY this table's header cell text
// "AMC" -> "Count". The paraId 521277E1 is unique to the NSR header cell, so
// this does not touch the "AMC" headers in the performance tables. ---
replaceOnce(
  `<w:p w14:paraId="521277E1" w14:textId="77777777" w:rsidR="00763431" w:rsidRDefault="00000000"><w:r><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t>AMC</w:t></w:r></w:p>`,
  `<w:p w14:paraId="521277E1" w14:textId="77777777" w:rsidR="00763431" w:rsidRDefault="00000000"><w:r><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t>Count</w:t></w:r></w:p>`,
);

// Nine-column performance-table column tags (equity / hybrid / comprehensive).
const perfTags = (loop: string): string[] => [
  `{#perf.${loop}}{schemeName}`,
  "{shortCategory}",
  "{amc}",
  "{r1m}",
  "{r3m}",
  "{r6m}",
  "{r1y}",
  "{si}",
  `{since}{/perf.${loop}}`,
];

// --- §03C Equity performance (header row 27, data rows 28..42) ---
assertRow(27, "1M %");
{
  const proto = assertRow(28, "Equity Long Short Fund");
  replaceRow(proto, tagifyRow(proto, perfTags("equity")));
  for (let i = 29; i <= 42; i++) deleteRow(ROWS[i]);
}

// --- §05C Hybrid performance (header row 70, data rows 71..82) ---
assertRow(70, "1M %");
{
  const proto = assertRow(71, "DynaSIF Active Asset Allocator Long-Short Fund");
  replaceRow(proto, tagifyRow(proto, perfTags("hybrid")));
  for (let i = 72; i <= 82; i++) deleteRow(ROWS[i]);
}

// Five-column top/bottom column tags.
const top3Tags = (loop: string): string[] => [
  `{#perf.${loop}}{schemeName}`,
  "{shortCategory}",
  "{amc}",
  "{r1m}",
  `{si}{/perf.${loop}}`,
];

// --- §06 Top 3 (header row 84, data rows 85..87) ---
assertRow(84, "1M Return");
{
  const proto = assertRow(85, "WSIF Equity Ex-Top 100 Long-Short Fund");
  replaceRow(proto, tagifyRow(proto, top3Tags("top3")));
  [86, 87].forEach((i) => deleteRow(ROWS[i]));
}

// --- §06 Bottom 3 (header row 88, data rows 89..91) ---
assertRow(88, "1M Return");
{
  const proto = assertRow(89, "qsif Sector Rotation Long-Short Fund");
  replaceRow(proto, tagifyRow(proto, top3Tags("bottom3")));
  [90, 91].forEach((i) => deleteRow(ROWS[i]));
}

// --- §07 Comprehensive (header row 92, data rows 93..119) ---
assertRow(92, "1M %");
{
  const proto = assertRow(93, "Altiva Equity Ex- Top 100 Long - Short Fund");
  replaceRow(proto, tagifyRow(proto, perfTags("comprehensive")));
  for (let i = 94; i <= 119; i++) deleteRow(ROWS[i]);
}

// ===========================================================================
// 4b) NSR CAPTION — replace month-varying literals with tags
// ===========================================================================
// The caption is a single contiguous run whose "6" (scheme count) and
// "1,740.00" (mobilised total) are June's literals — a May report would show
// them wrongly. Tag both (and the inline "June 2026" -> {monthLabel}) so the
// caption is fully dynamic. Done BEFORE the global "June 2026" step below.
replaceOnce(
  `<w:r><w:t>6 new schemes launched in June 2026, raising ₹1,740.00 Cr. Source: AMFI NSR data.</w:t></w:r>`,
  `<w:r><w:t xml:space="preserve">{universe.nsr.totalSchemes} new schemes launched in {monthLabel}, raising ₹{nsrMobilised} Cr. Source: AMFI NSR data.</w:t></w:r>`,
);

// ===========================================================================
// 5) REMAINING MONTH LITERALS
// ===========================================================================
// After the prose replacement removed the §02 overview occurrence and the NSR
// caption above consumed its own "June 2026", the only remaining raw
// "June 2026" string is the AMFI monthly-report source caption.
{
  const before = xml;
  xml = xml.split("June 2026").join("{monthLabel}");
  if (xml === before) throw new Error('expected residual "June 2026" captions not found');
}

// ===========================================================================
// 6) STRIP page-2 Market Snapshot + §02 category-chart images
// ===========================================================================
stripDrawing("rId7"); // §01 Market Snapshot — "Performance across asset classes"
stripDrawing("rId8"); // §01 Market Snapshot — "Category-wise net inflows"
stripDrawing("rId9"); // §02 chart — "AUM by Category"
stripDrawing("rId10"); // §02 chart — "Number of Schemes by Category"

// ===========================================================================
// write
// ===========================================================================
zip.file("word/document.xml", xml);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, zip.generate({ type: "nodebuffer" }));
console.log("wrote", OUT);
