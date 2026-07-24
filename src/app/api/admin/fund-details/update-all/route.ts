import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundDetails from "@/models/FundDetails";
import { fetchFundByIsin, mapFinApiToFundDetails } from "@/lib/finApiClient";
import { syncAmfiSourcesForFund, type SourceOutcome } from "@/lib/amfiSync";

// "Update all sources" for a single fund: finapi + AMFI SSD + AMFI TER.
//
// Every source is reported separately and independently. A fund whose SSD is not
// published (4 of 28 today) still gets finapi and TER applied — the SSD outcome
// simply comes back ok:false with the reason, which the admin UI shows inline.

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!(await hasPageAccess(req, "fundDetails", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { fundName } = (await req.json().catch(() => ({}))) as { fundName?: string };
  if (!fundName) return NextResponse.json({ error: "fundName required" }, { status: 400 });

  await connectDB();
  const fund = await FundDetails.findOne({ fundName }, { isin: 1, _id: 0 }).lean<{ isin?: string } | null>();
  if (!fund) return NextResponse.json({ error: `No record for "${fundName}"` }, { status: 404 });

  const outcomes: SourceOutcome[] = [];

  // ── finapi (by the ISIN already on the record) ──────────────────────────────
  const isin = (fund.isin ?? "").trim().toUpperCase();
  if (!isin) {
    outcomes.push({
      source: "finapi",
      ok: false,
      fieldsWritten: [],
      message: "no ISIN on this record — use “Sync from ISIN” once to seed it",
    });
  } else {
    try {
      const raw = await fetchFundByIsin(isin);
      const mapped = mapFinApiToFundDetails(raw);
      await FundDetails.findOneAndUpdate({ fundName }, { $set: mapped }, { upsert: false });
      outcomes.push({
        source: "finapi",
        ok: true,
        fieldsWritten: Object.keys(mapped),
        message: `finapi ${isin} — ${Object.keys(mapped).length} fields`,
      });
    } catch (err) {
      outcomes.push({
        source: "finapi",
        ok: false,
        fieldsWritten: [],
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── AMFI SSD + TER ─────────────────────────────────────────────────────────
  const amfi = await syncAmfiSourcesForFund(fundName);
  outcomes.push(...amfi.outcomes);

  if (outcomes.some((o) => o.ok)) {
    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag("sif-data");
  }

  return NextResponse.json({
    fundName,
    schemeId: amfi.schemeId,
    outcomes,
    anyOk: outcomes.some((o) => o.ok),
  });
}
