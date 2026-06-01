import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SIFScheme from "@/models/SIFScheme";

export const revalidate = 3600;

export async function GET() {
  await connectDB();
  const rows = await SIFScheme.aggregate([
    { $match: { brandName: { $exists: true, $ne: "" } } },
    { $group: { _id: "$brandName", companyName_short: { $first: "$companyName_short" } } },
    { $sort: { _id: 1 } },
  ]);
  const result = rows.map((r: { _id: string; companyName_short?: string }) => ({
    brandName: r._id,
    companyName_short: r.companyName_short ?? "",
  }));
  return NextResponse.json(result);
}
