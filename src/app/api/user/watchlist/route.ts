import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Watchlist from "@/models/Watchlist";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const wl = await Watchlist.findOne({ userId }).lean();
  return NextResponse.json({ schemeCodes: wl?.schemeCodes ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { schemeCode } = await req.json();
  if (!schemeCode) return NextResponse.json({ error: "Missing schemeCode" }, { status: 400 });
  await connectDB();
  await Watchlist.findOneAndUpdate(
    { userId },
    { $addToSet: { schemeCodes: schemeCode } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { schemeCode } = await req.json();
  await connectDB();
  await Watchlist.findOneAndUpdate({ userId }, { $pull: { schemeCodes: schemeCode } });
  return NextResponse.json({ ok: true });
}
