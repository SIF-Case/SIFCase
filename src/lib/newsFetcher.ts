import { connectDB } from "@/lib/mongodb";
import NewsConfig from "@/models/NewsConfig";
import NewsItem from "@/models/NewsItem";

// ── RSS XML parser (no external deps) ────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(xml);
  return match ? stripHtml(match[1]).trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["']`, "i").exec(xml);
  return match ? match[1].trim() : "";
}

export interface RawNewsItem {
  title: string;
  url: string;
  excerpt: string;
  imageUrl: string;
  publishedAt: Date;
  source: string;
}

function parseRssItems(xml: string, sourceName: string): RawNewsItem[] {
  const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const items: RawNewsItem[] = [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, "title");
    const link =
      extractTag(itemXml, "link") ||
      extractAttr(itemXml, "link", "href") ||
      extractTag(itemXml, "guid");
    if (!title || !link) continue;

    const excerpt =
      extractTag(itemXml, "description") ||
      extractTag(itemXml, "summary") ||
      extractTag(itemXml, "content:encoded");

    // Try to find image from media:thumbnail, media:content, or enclosure
    const imageUrl =
      extractAttr(itemXml, "media:thumbnail", "url") ||
      extractAttr(itemXml, "media:content", "url") ||
      extractAttr(itemXml, "enclosure", "url") ||
      "";

    const pubDateStr =
      extractTag(itemXml, "pubDate") ||
      extractTag(itemXml, "published") ||
      extractTag(itemXml, "dc:date");
    const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date();

    items.push({
      title: title.slice(0, 300),
      url: link.slice(0, 1000),
      excerpt: excerpt.slice(0, 1000),
      imageUrl: imageUrl.slice(0, 500),
      publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
      source: sourceName,
    });
  }

  return items;
}

async function fetchRssFeed(url: string, sourceName: string): Promise<RawNewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SIFcase/1.0 (+https://sifcase.in)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, sourceName);
  } catch {
    return [];
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export interface FetchNewsResult {
  fetched: number;
  stored: number;
  skipped: number;
  errors: number;
}

export async function fetchAndStoreNews(): Promise<FetchNewsResult> {
  await connectDB();

  const config = await NewsConfig.findOne().lean();

  const keywords = config?.keywords ?? ["Specialised Investment Fund India", "SIF SEBI"];
  const blacklist = (config?.blacklistedKeywords ?? []).map((k) => k.toLowerCase());
  const rssFeeds = (config?.rssFeeds ?? []).filter((f) => f.enabled);
  const maxItems = config?.maxItemsPerFetch ?? 30;
  const retentionDays = config?.retentionDays ?? 30;

  // Collect all raw items
  const rawItemsMap = new Map<string, RawNewsItem>();

  const allFeeds: { url: string; name: string }[] = [
    ...keywords.map((kw) => ({
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=en-IN&gl=IN&ceid=IN:en`,
      name: kw,
    })),
    ...rssFeeds.map((f) => ({ url: f.url, name: f.name })),
  ];

  const feedResults = await Promise.all(
    allFeeds.map(({ url, name }) => fetchRssFeed(url, name)),
  );

  for (const items of feedResults) {
    for (const item of items) {
      if (!rawItemsMap.has(item.url)) {
        rawItemsMap.set(item.url, item);
      }
    }
  }

  const keywordsLower = keywords.map((k) => k.toLowerCase());

  const allRaw = Array.from(rawItemsMap.values())
    .filter((i) => {
      // For Google News feeds the source IS the keyword so always relevant.
      // For direct RSS feeds, require at least one keyword in title or excerpt.
      if (keywordsLower.length === 0) return true;
      const isGoogleNewsFeed = i.source && keywordsLower.includes(i.source.toLowerCase());
      if (isGoogleNewsFeed) return true;
      const text = `${i.title} ${i.excerpt}`.toLowerCase();
      return keywordsLower.some((kw) => text.includes(kw));
    })
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, maxItems * 2);

  // Find which URLs already exist
  const existingUrls = new Set(
    (await NewsItem.find({ url: { $in: allRaw.map((i) => i.url) } }, "url").lean()).map((d) => d.url),
  );

  const newItems = allRaw
    .filter((i) => !existingUrls.has(i.url))
    .filter((i) => {
      if (blacklist.length === 0) return true;
      const text = `${i.title} ${i.excerpt}`.toLowerCase();
      return !blacklist.some((term) => text.includes(term));
    })
    .slice(0, maxItems);

  let stored = 0;
  let errors = 0;

  await Promise.all(
    newItems.map(async (item) => {
      try {
        await NewsItem.create({
          title: item.title,
          url: item.url,
          source: item.source,
          originalExcerpt: item.excerpt,
          aiSummary: "",
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          fetchedAt: new Date(),
          isVisible: true,
        });
        stored++;
      } catch {
        errors++;
      }
    }),
  );

  // Purge old items
  if (retentionDays > 0) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await NewsItem.deleteMany({ publishedAt: { $lt: cutoff }, promotedArticleId: null });
  }

  return {
    fetched: allRaw.length,
    stored,
    skipped: existingUrls.size,
    errors,
  };
}
