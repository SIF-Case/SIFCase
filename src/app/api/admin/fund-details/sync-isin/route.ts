import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundDetails from "@/models/FundDetails";
import SIFScheme from "@/models/SIFScheme";
import { revalidateTag, revalidatePath } from "next/cache";
import { fetchFundByIsin, mapFinApiToFundDetails } from "@/lib/finApiClient";

const ISIN_RE = /^[A-Za-z0-9]{9,12}$/;

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const body = await req.json();
  const isin = typeof body.isin === "string" ? body.isin.trim().toUpperCase() : "";
  if (!isin || !ISIN_RE.test(isin)) {
    return NextResponse.json({ error: "Valid ISIN required" }, { status: 400 });
  }

  const scheme = await SIFScheme.findOne(
    { $or: [{ isinGrowth: isin }, { isinReinvestment: isin }] },
    { fundName: 1 },
  ).lean();
  if (!scheme) {
    return NextResponse.json(
      { error: "No matching scheme for this ISIN — sync NAV/schemes first" },
      { status: 404 },
    );
  }

  let mapped;
  try {
    const raw = await fetchFundByIsin(isin);
    mapped = mapFinApiToFundDetails(raw);
  } catch (err) {
    console.error("[fund-details sync-isin] finapi fetch failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `finapi request failed: ${msg}` }, { status: 502 });
  }

  try {
    // planCodes accumulate across syncs of different plan/option variants of the same
    // fund (each finapi call only returns its own ISIN's plan) — merge instead of overwrite.
    const existing = await FundDetails.findOne({ fundName: scheme.fundName }, { planCodes: 1 }).lean();
    if (existing?.planCodes?.length || mapped.planCodes?.length) {
      const byIsin = new Map<string, { planName: string; isin: string }>();
      for (const pc of existing?.planCodes ?? []) byIsin.set(pc.isin, pc);
      for (const pc of mapped.planCodes ?? []) byIsin.set(pc.isin, pc);
      mapped.planCodes = Array.from(byIsin.values());
    }

    await FundDetails.findOneAndUpdate(
      { fundName: scheme.fundName },
      { $set: mapped },
      { upsert: true, returnDocument: "after" },
    );

    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag("sif-data");

    const schemes = await SIFScheme.find({ fundName: scheme.fundName }, { schemeCode: 1, _id: 0 }).lean();
    for (const s of schemes) {
      revalidatePath(`/sifs/${(s.schemeCode as string).toLowerCase()}`);
    }
    revalidatePath("/");
    revalidatePath("/sifs");
    revalidatePath("/compare");

    return NextResponse.json({ success: true, fundName: scheme.fundName, updatedFields: Object.keys(mapped) });
  } catch (err) {
    console.error("[fund-details sync-isin] save error", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
