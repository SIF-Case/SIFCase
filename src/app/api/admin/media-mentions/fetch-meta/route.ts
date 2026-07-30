import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";

// A generic browser UA — some outlets (Moneycontrol's Akamai bot manager
// among them) 403 requests that self-identify as a bot/crawler in the UA string.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function metaTag(html: string, ...names: string[]): string | undefined {
  for (const name of names) {
    // Matches <meta property="og:title" content="...">  in either attribute order.
    // The quote char is captured and backreferenced (not just excluded from the
    // value) so an apostrophe inside a double-quoted value — e.g. "SEBI's" —
    // doesn't truncate the match.
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=(["'])${name}\\1[^>]+content=(["'])(.*?)\\2`, "i");
    const re2 = new RegExp(`<meta[^>]+content=(["'])(.*?)\\1[^>]+(?:property|name)=(["'])${name}\\3`, "i");
    const m1 = html.match(re1);
    if (m1?.[3]) return decodeEntities(m1[3].trim());
    const m2 = html.match(re2);
    if (m2?.[2]) return decodeEntities(m2[2].trim());
  }
  return undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'");
}

export async function GET(req: NextRequest) {
  if (!(await hasPageAccess(req, "mediaMentions", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url query param required" }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "URL is not valid" }, { status: 400 });
  }

  try {
    const ctl = new AbortController();
    const timeout = setTimeout(() => ctl.abort(), 15_000);
    const target = new URL(url);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `${target.origin}/`,
      },
      redirect: "follow",
      signal: ctl.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed with status ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    let title = metaTag(html, "og:title", "twitter:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    const imageUrl = metaTag(html, "og:image", "twitter:image", "twitter:image:src");
    const siteName = metaTag(html, "og:site_name");
    const description = metaTag(html, "og:description", "twitter:description", "description");

    if (title && siteName) {
      // Strip a trailing "- Site Name" / "| Site Name" the page's own <title>
      // or og:title often appends — the outlet badge already shows that.
      const suffix = new RegExp(`\\s*[-|–]\\s*${siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\.com)?\\s*$`, "i");
      title = title.replace(suffix, "").trim();
    }

    return NextResponse.json({
      title: title ? decodeEntities(title) : null,
      imageUrl: imageUrl ?? null,
      outlet: siteName ?? null,
      tag: description ? decodeEntities(description) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fetch failed" }, { status: 502 });
  }
}
