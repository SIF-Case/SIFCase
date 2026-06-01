import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code } = await params;
  await connectDB();
  const db = mongoose.connection.db!;

  const [scheme, navRecords] = await Promise.all([
    db.collection("sifschemes").findOne({ schemeCode: code.toUpperCase() }),
    db.collection("sifnavs")
      .find({ schemeCode: code.toUpperCase() })
      .sort({ navDate: -1 })
      .limit(60)
      .toArray(),
  ]);

  if (!scheme) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ scheme, navRecords });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code } = await params;
  await connectDB();
  const db = mongoose.connection.db!;

  const body = await req.json();
  const ALLOWED = ["schemeName", "amc", "fundType", "isinGrowth", "isinReinvestment", "plan", "option", "strategy", "companyName", "companyName_short", "brandName", "fundName", "isActive"];
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }

  const result = await db.collection("sifschemes").updateOne(
    { schemeCode: code.toUpperCase() },
    { $set: { ...update, updatedAt: new Date() } },
  );

  if (result.matchedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
