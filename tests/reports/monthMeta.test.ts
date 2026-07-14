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
