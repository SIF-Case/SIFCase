import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import PageSeo from "@/models/PageSeo";
import { getSeoPageDef } from "@/lib/seoRegistry";

export const PAGE_SEO_TAG = "page-seo";

export type SeoTokens = Record<string, string | number | null | undefined>;

type SeoOverride = {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  imageAlt: string;
  robotsIndex: boolean;
};

/**
 * The whole override table in one cached read — it has at most a few dozen rows
 * and every rendered page needs exactly one of them, so per-path queries would
 * be pure overhead. Busted by revalidateTag(PAGE_SEO_TAG) on save.
 */
const getOverrides = unstable_cache(
  async (): Promise<Record<string, SeoOverride>> => {
    await connectDB();
    const rows = await PageSeo.find({}).lean();
    const map: Record<string, SeoOverride> = {};
    for (const r of rows) {
      map[r.path] = {
        title: r.title ?? "",
        description: r.description ?? "",
        canonicalUrl: r.canonicalUrl ?? "",
        ogImage: r.ogImage ?? "",
        imageAlt: r.imageAlt ?? "",
        robotsIndex: r.robotsIndex !== false,
      };
    }
    return map;
  },
  ["page-seo-overrides"],
  { tags: [PAGE_SEO_TAG], revalidate: 3600 },
);

/** Replace {token} placeholders; unknown tokens collapse to an empty string. */
function fillTokens(template: string, tokens: SeoTokens): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => {
      const v = tokens[key];
      return v === null || v === undefined ? "" : String(v);
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Build a page's Metadata from (1) the admin override, (2) the registry default,
 * (3) whatever the route passes as `fallback` — first non-empty wins.
 *
 * `path` is the registry key: a literal route ("/privacy") or a pattern
 * ("/sifs/[code]"). Routes that build their strings from data pass those values
 * as `tokens` so an edited template can interpolate them.
 */
export async function resolvePageMetadata({
  path,
  tokens = {},
  fallback,
}: {
  path: string;
  tokens?: SeoTokens;
  fallback?: { title?: string; description?: string; canonical?: string };
}): Promise<Metadata> {
  const def = getSeoPageDef(path);
  let overrides: Record<string, SeoOverride> = {};
  try {
    overrides = await getOverrides();
  } catch {
    // A metadata lookup must never take a page down — fall through to defaults.
  }
  const o = overrides[path];

  const titleTemplate = o?.title || def?.title || fallback?.title || "";
  const descTemplate = o?.description || def?.description || fallback?.description || "";

  const title = titleTemplate ? fillTokens(titleTemplate, tokens) : undefined;
  const description = descTemplate ? fillTokens(descTemplate, tokens) : undefined;
  const canonical = o?.canonicalUrl ? fillTokens(o.canonicalUrl, tokens) : fallback?.canonical;

  const meta: Metadata = {};
  if (title) meta.title = title;
  if (description) meta.description = description;
  if (canonical) meta.alternates = { canonical };
  if (o && !o.robotsIndex) meta.robots = { index: false, follow: true };
  if (o?.ogImage) {
    meta.openGraph = {
      title,
      description,
      images: [{ url: o.ogImage, alt: fillTokens(o.imageAlt || title || "", tokens) }],
    };
  }
  return meta;
}

/**
 * Alt text for a page's hero/primary image, so the admin-set value reaches the
 * rendered <img> and not just the og:image tag.
 */
export async function getPageImageAlt(path: string, tokens: SeoTokens = {}): Promise<string | null> {
  try {
    const overrides = await getOverrides();
    const alt = overrides[path]?.imageAlt;
    return alt ? fillTokens(alt, tokens) : null;
  } catch {
    return null;
  }
}
