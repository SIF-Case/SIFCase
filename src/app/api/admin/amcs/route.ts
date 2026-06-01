import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const amcs: string[] = await mongoose.connection.db!
    .collection("sifschemes")
    .distinct("companyName");
  return NextResponse.json({ amcs: amcs.filter(Boolean).sort() });
}
