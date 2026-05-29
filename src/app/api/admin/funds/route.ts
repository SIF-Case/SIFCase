import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const db = mongoose.connection.db!;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const search = searchParams.get("q") ?? "";

  const query = search ? { schemeName: { $regex: search, $options: "i" } } : {};

  const [schemes, total] = await Promise.all([
    db.collection("sifschemes").find(query).sort({ amc: 1, schemeName: 1 }).skip((page - 1) * limit).limit(limit).toArray(),
    db.collection("sifschemes").countDocuments(query),
  ]);

  // Nav counts per scheme
  const codes = schemes.map((s) => s.schemeCode);
  const navCounts = await db.collection("sifnavs").aggregate([
    { $match: { schemeCode: { $in: codes } } },
    { $group: { _id: "$schemeCode", count: { $sum: 1 }, lastDate: { $max: "$navDate" } } },
  ]).toArray();
  const navMap = Object.fromEntries(navCounts.map((n) => [n._id, { count: n.count, lastDate: n.lastDate }]));

  return NextResponse.json({
    schemes: schemes.map((s) => ({ ...s, navCount: navMap[s.schemeCode as string]?.count ?? 0, lastNav: navMap[s.schemeCode as string]?.lastDate ?? null })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
