import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Watchlist from "@/models/Watchlist";
import SIFScheme from "@/models/SIFScheme";
import { logClientActivity } from "@/lib/activityLogger";

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
  let schemeInfo = schemeCode;
  try {
    const scheme = await SIFScheme.findOne({ schemeCode }).lean();
    if (scheme) {
      const isin = scheme.isinGrowth || scheme.isinReinvestment || "";
      schemeInfo = `${scheme.schemeName}${isin ? ` (${isin})` : ""}`;
    }
  } catch (err) {
    console.error("Watchlist SIFScheme lookup error:", err);
  }

  try {
    await logClientActivity(userId, "Wishlist", `Added scheme to watchlist: ${schemeInfo}`);
  } catch (err) {
    console.error("Watchlist activity logger error:", err);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { schemeCode } = await req.json();
  await connectDB();
  await Watchlist.findOneAndUpdate({ userId }, { $pull: { schemeCodes: schemeCode } });
  let schemeInfo = schemeCode;
  try {
    const scheme = await SIFScheme.findOne({ schemeCode }).lean();
    if (scheme) {
      const isin = scheme.isinGrowth || scheme.isinReinvestment || "";
      schemeInfo = `${scheme.schemeName}${isin ? ` (${isin})` : ""}`;
    }
  } catch (err) {
    console.error("Watchlist SIFScheme lookup error:", err);
  }

  try {
    await logClientActivity(userId, "Wishlist", `Removed scheme from watchlist: ${schemeInfo}`);
  } catch (err) {
    console.error("Watchlist activity logger error:", err);
  }
  return NextResponse.json({ ok: true });
}
