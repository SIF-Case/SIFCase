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
