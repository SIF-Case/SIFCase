import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import SavedCompare from "@/models/SavedCompare";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const compares = await SavedCompare.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ compares });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, schemeCodes, period } = await req.json();
  if (!name || !schemeCodes?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await connectDB();
  const saved = await SavedCompare.create({ userId, name, schemeCodes, period: period ?? "SI" });
  return NextResponse.json({ ok: true, id: saved._id });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await connectDB();
  await SavedCompare.findOneAndDelete({ _id: id, userId });
  return NextResponse.json({ ok: true });
}
