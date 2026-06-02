import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundDetails from "@/models/FundDetails";

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const body = await req.json();
  const { fundName, ...rest } = body;
  if (!fundName) return NextResponse.json({ error: "fundName required" }, { status: 400 });

  // Strip empty arrays from $set so they don't overwrite existing saved data.
  // An empty array means the user left the section blank — preserve whatever was in DB.
  const arrayFields = ["fundManagers", "assetAllocation", "portfolioByIndustry", "portfolioByRatingClass", "topHoldings", "factsheets"];
  const setPayload: Record<string, unknown> = { fundName };
  for (const [k, v] of Object.entries(rest)) {
    if (arrayFields.includes(k) && Array.isArray(v) && v.length === 0) continue; // skip empty arrays
    setPayload[k] = v;
  }

  try {
    await FundDetails.findOneAndUpdate(
      { fundName },
      { $set: setPayload },
      { upsert: true, returnDocument: "after" },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[FundDetails save error]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
