import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RecentlyViewed from "@/models/RecentlyViewed";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ recent: [] });
  await connectDB();
  const recent = await RecentlyViewed.find({ userId }).sort({ viewedAt: -1 }).limit(10).lean();
  return NextResponse.json({ recent });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false });
  const { schemeCode, schemeName } = await req.json();
  if (!schemeCode) return NextResponse.json({ ok: false });
  await connectDB();
  await RecentlyViewed.findOneAndUpdate(
    { userId, schemeCode },
    { schemeName, viewedAt: new Date() },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}
