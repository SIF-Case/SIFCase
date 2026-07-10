import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FundDetails from "@/models/FundDetails";
import { revalidateTag, revalidatePath } from "next/cache";
import SIFScheme from "@/models/SIFScheme";

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "fundDetails", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const body = await req.json();
  const { fundName, ...rest } = body;
  if (!fundName) return NextResponse.json({ error: "fundName required" }, { status: 400 });

  // Strip empty arrays from $set so they don't overwrite existing saved data.
  // An empty array means the user left the section blank — preserve whatever was in DB.
  const arrayFields = [
    "fundManagers", "assetAllocation", "portfolioByIndustry", "portfolioByRatingClass", "topHoldings", "factsheets",
    "planCodes", "sipDetails", "terSlabs", "assetAllocationRanges", "derivativeStrategies",
    // finapi-sync arrays — same "blank means untouched" rule applies here
    "rollingReturns", "categoryRanks", "peers",
  ];
  // Nullable finapi-sync objects: skip when null so an unrelated save doesn't wipe a previous sync.
  const nullableObjectFields = ["fundamentals", "concentration", "marketCapWeightage", "amcOtherFunds"];
  const setPayload: Record<string, unknown> = { fundName };
  for (const [k, v] of Object.entries(rest)) {
    if (arrayFields.includes(k) && Array.isArray(v) && v.length === 0) continue; // skip empty arrays
    if (nullableObjectFields.includes(k) && v == null) continue; // skip untouched nullable objects
    if (k === "riskMetricsConclusions" && v && typeof v === "object") {
      const allEmpty = Object.values(v as Record<string, { info?: string; timeframes?: unknown[] }>).every(
        (group) => !group.info && (!group.timeframes || group.timeframes.length === 0),
      );
      if (allEmpty) continue;
    }
    setPayload[k] = v;
  }

  try {
    await FundDetails.findOneAndUpdate(
      { fundName },
      { $set: setPayload },
      { upsert: true, returnDocument: "after" },
    );

    // Bust the data cache (unstable_cache entries)
    // @ts-expect-error - Next.js 16 type definition bug, revalidateTag only needs 1 argument
    revalidateTag("sif-data");

    // Bust the rendered page cache (export const revalidate = 3600 on the fund page).
    // Look up all scheme codes that belong to this fundName so we can purge each URL.
    const schemes = await SIFScheme.find({ fundName }, { schemeCode: 1, _id: 0 }).lean();
    for (const s of schemes) {
      revalidatePath(`/sifs/${(s.schemeCode as string).toLowerCase()}`);
    }

    revalidatePath("/");
    revalidatePath("/sifs");
    revalidatePath("/compare");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[FundDetails save error]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
