import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import NewsConfig, { DEFAULT_RSS_FEEDS, DEFAULT_ARTICLE_GEN_PROMPT } from "@/models/NewsConfig";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  let config = await NewsConfig.findOne({}).lean();
  if (!config) {
    const doc = new NewsConfig({});
    await doc.save();
    config = doc.toObject();
  } else {
    const patch: Record<string, unknown> = {};
    if (!config.rssFeeds || config.rssFeeds.length === 0) patch.rssFeeds = DEFAULT_RSS_FEEDS;
    // Backfill prompt if missing or still the old short default
    if (!config.articleGenerationPrompt || config.articleGenerationPrompt.length < 500) {
      patch.articleGenerationPrompt = DEFAULT_ARTICLE_GEN_PROMPT;
    }
    if (Object.keys(patch).length > 0) {
      config = await NewsConfig.findOneAndUpdate({}, { $set: patch }, { new: true }).lean() ?? config;
    }
  }
  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { keywords, blacklistedKeywords, rssFeeds, aiPrompt, articleGenerationPrompt, maxItemsPerFetch, retentionDays } = body;

  const update: Record<string, unknown> = {};
  if (Array.isArray(keywords)) update.keywords = keywords.map(String).filter(Boolean);
  if (Array.isArray(blacklistedKeywords)) update.blacklistedKeywords = blacklistedKeywords.map(String).filter(Boolean);
  if (Array.isArray(rssFeeds)) update.rssFeeds = rssFeeds;
  if (typeof aiPrompt === "string") update.aiPrompt = aiPrompt.trim();
  if (typeof articleGenerationPrompt === "string") update.articleGenerationPrompt = articleGenerationPrompt.trim();
  if (typeof maxItemsPerFetch === "number") update.maxItemsPerFetch = Math.max(1, Math.min(100, maxItemsPerFetch));
  if (typeof retentionDays === "number") update.retentionDays = Math.max(1, Math.min(365, retentionDays));

  const config = await NewsConfig.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true }).lean();
  return NextResponse.json({ ok: true, config });
}
