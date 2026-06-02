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
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50")));
  const search   = searchParams.get("q")        ?? "";
  const plan     = searchParams.get("plan")      ?? "";
  const option   = searchParams.get("option")    ?? "";
  const strategy = searchParams.get("strategy")  ?? "";
  const active   = searchParams.get("active")    ?? "";
  const amc      = searchParams.get("amc")       ?? "";

  const and: object[] = [];
  if (search) and.push({ $or: [
    { schemeName:       { $regex: search, $options: "i" } },
    { schemeCode:       { $regex: search, $options: "i" } },
    { amc:              { $regex: search, $options: "i" } },
    { isinGrowth:       { $regex: search, $options: "i" } },
    { isinReinvestment: { $regex: search, $options: "i" } },
    { brandName:        { $regex: search, $options: "i" } },
    { fundName:         { $regex: search, $options: "i" } },
  ]});
  if (amc)      and.push({ amc:      { $regex: amc,      $options: "i" } });
  if (plan)     and.push({ plan });
  if (option)   and.push({ option });
  if (strategy) and.push({ strategy });
  if (active === "true")  and.push({ isActive: true });
  if (active === "false") and.push({ isActive: false });

  const query = and.length > 0 ? { $and: and } : {};

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
