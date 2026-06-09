import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import NewsConfig from "@/models/NewsConfig";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const config = await NewsConfig.findOne().lean();
  return NextResponse.json({ config: config ?? null });
}

export async function PATCH(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { keywords, rssFeeds, aiPrompt, maxItemsPerFetch, retentionDays } = body;

  const update: Record<string, unknown> = {};
  if (Array.isArray(keywords)) update.keywords = keywords.map(String).filter(Boolean);
  if (Array.isArray(rssFeeds)) update.rssFeeds = rssFeeds;
  if (typeof aiPrompt === "string") update.aiPrompt = aiPrompt.trim();
  if (typeof maxItemsPerFetch === "number") update.maxItemsPerFetch = Math.max(1, Math.min(100, maxItemsPerFetch));
  if (typeof retentionDays === "number") update.retentionDays = Math.max(1, Math.min(365, retentionDays));

  const config = await NewsConfig.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true }).lean();
  return NextResponse.json({ ok: true, config });
}
