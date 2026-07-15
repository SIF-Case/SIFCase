import { NextResponse } from "next/server";
import { getSnapshotStats } from "@/lib/sifData";

// Lightweight public stats for footer/marketing copy — cached same as the
// rest of getSnapshotStats (2hr TTL, invalidated on the sif-data tag).
export async function GET() {
  const stats = await getSnapshotStats();
  return NextResponse.json({
    // Only Regular Growth schemes counted
    totalFunds: stats.totalGrowthRegular,
    uniqueAMCs: stats.uniqueAMCs,
  });
}
