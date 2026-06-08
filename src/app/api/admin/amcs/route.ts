import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const amcs: string[] = await mongoose.connection.db!
    .collection("sifschemes")
    .distinct("companyName");
  return NextResponse.json({ amcs: amcs.filter(Boolean).sort() });
}
