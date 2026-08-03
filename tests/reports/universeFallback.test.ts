import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { previousMonthToDate } from "@/lib/reports/monthMeta";
import { fetchUniverse, AmfiMonthUnavailableError } from "@/lib/reports/amfiUniverse";

assert.equal(previousMonthToDate("2026-06-30"), "2026-05-31");
assert.equal(previousMonthToDate("2026-03-31"), "2026-02-28");
assert.equal(previousMonthToDate("2026-01-31"), "2025-12-31");

async function main() {
  const pdf = readFileSync(join(process.cwd(), "tests/fixtures/amfi-jun2026.pdf"));

  // AMFI serves the June PDF but not July: the July run must surface a recoverable
  // error naming June as the fallback, and only fetch June once opted in.
  const requested: string[] = [];
  globalThis.fetch = (async (url: string) => {
    requested.push(String(url));
    if (String(url).includes("jun2026")) {
      return new Response(new Uint8Array(pdf), { status: 200 });
    }
    return new Response("Not Found", { status: 404 });
  }) as unknown as typeof fetch;

  let raised: unknown;
  try {
    await fetchUniverse("2026-07-31");
  } catch (e) {
    raised = e;
  }
  assert.ok(raised instanceof AmfiMonthUnavailableError, "unpublished month raises the recoverable error");
  assert.equal((raised as AmfiMonthUnavailableError).monthLabel, "July 2026");
  assert.equal((raised as AmfiMonthUnavailableError).previousMonthLabel, "June 2026");
  assert.deepEqual(requested, ["https://portal.amfiindia.com/spages/sif_amjul2026repo.pdf"]);

  const fallback = await fetchUniverse("2026-07-31", { usePreviousMonth: true });
  assert.equal(fallback.fallbackMonthLabel, "June 2026");
  assert.equal(fallback.data.monthLabel, "June 2026");
  assert.equal(fallback.data.grandTotal.schemes > 0, true);
  assert.ok(requested.includes("https://portal.amfiindia.com/spages/sif_amjun2026repo.pdf"));

  // The month's own report, when published, is used with no fallback label.
  const direct = await fetchUniverse("2026-06-30");
  assert.equal(direct.fallbackMonthLabel, null);
  assert.equal(direct.data.monthLabel, "June 2026");

  // Two consecutive missing months is a hard failure, not a silent two-month hop.
  globalThis.fetch = (async () => new Response("Not Found", { status: 404 })) as unknown as typeof fetch;
  await assert.rejects(
    fetchUniverse("2026-07-31", { usePreviousMonth: true }),
    /AMFI reports for both July 2026 and June 2026 are unavailable/,
  );

  console.log("OK universeFallback");
}

main();
