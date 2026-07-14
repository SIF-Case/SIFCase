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

// ── dash-as-nil (AMFI prints "-" for zero cells, e.g. May 2026) ──────────
// May's Debt rows and Sub Total - II are all "-" (nil), unlike June's "0.00".
const may = readFileSync(join(process.cwd(), "tests/fixtures/amfi-may2026.txt"), "utf8");
const um = parseUniverseText(may, "May 2026");
assert.equal(um.categories.length, 6);                 // debt row still present (all-zero)
const debtM = um.categories.find((c) => c.key === "debt_ls")!;
assert.equal(debtM.schemes, 0);                        // "-" parsed as 0, not dropped
assert.equal(debtM.aumCr, 0);
assert.equal(um.grandTotal.schemes, 21);
assert.equal(um.grandTotal.folios, 56749);
assert.equal(um.grandTotal.aumCr, 13813.72);
assert.equal(um.grandTotal.netFlowCr, 1395.81);
console.log("OK amfiUniverse dash-nil");

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
