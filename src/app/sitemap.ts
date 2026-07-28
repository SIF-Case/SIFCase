import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import SIFScheme from "@/models/SIFScheme";
import Article from "@/models/Article";
import Nfo from "@/models/Nfo";
import PerformanceReport from "@/models/PerformanceReport";
import { fundHref } from "@/lib/slugify";

export const BASE_URL = "https://www.sifcase.com";

// Without this, Next statically generates sitemap.xml once at build time and
// it goes stale until the next deploy. ISR regenerates it at most hourly so
// new funds/articles/NFOs show up without needing a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [schemes, brandNames, articles, nfos, reports] = await Promise.all([
    // Regular plan only — Direct rows 308 to their Regular page, so submitting
    // them just feeds Google duplicate URLs of every fund.
    SIFScheme.find({ plan: "Regular" }, "schemeCode fundName updatedAt").lean(),
    SIFScheme.distinct("brandName"),
    Article.find({ status: "published" }, "slug category updatedAt publishedAt").lean(),
    Nfo.find({ published: true }, "slug updatedAt").lean(),
    PerformanceReport.find({}, "slug updatedAt").lean(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/sifs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/fund-houses`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/compare`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/sif-101`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/nfos`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/read`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/news`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/suitability`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/disclaimer`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const schemeUrls: MetadataRoute.Sitemap = schemes
    .filter((s) => s.schemeCode && s.fundName)
    .map((s) => ({
      url: `${BASE_URL}${fundHref(String(s.fundName), String(s.schemeCode))}`,
      lastModified: s.updatedAt ?? undefined,
      changeFrequency: "daily",
      priority: 0.85,
    }));

  const fundHouseUrls: MetadataRoute.Sitemap = brandNames
    .filter((b): b is string => Boolean(b))
    .map((b) => ({
      url: `${BASE_URL}/fund-house/${encodeURIComponent(b.toLowerCase().replace(/\s+/g, "-"))}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // Each article's canonical section mirrors the category filter each hub page
  // uses (SIF Education -> /sif-101, News categories -> /news, else -> /read).
  const articleUrls: MetadataRoute.Sitemap = articles
    .filter((a) => a.slug)
    .map((a) => {
      const section =
        a.category === "SIF Education" ? "sif-101" :
        a.category === "General News" || a.category === "Fund Houses" ? "news" :
        "read";
      return {
        url: `${BASE_URL}/${section}/${a.slug}`,
        lastModified: a.updatedAt ?? a.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      };
    });

  const nfoUrls: MetadataRoute.Sitemap = nfos
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/nfos/${n.slug}`,
      lastModified: n.updatedAt ?? undefined,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  const reportUrls: MetadataRoute.Sitemap = reports
    .filter((r) => r.slug)
    .map((r) => ({
      url: `${BASE_URL}/performance/${r.slug}`,
      lastModified: r.updatedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [...staticPages, ...schemeUrls, ...fundHouseUrls, ...articleUrls, ...nfoUrls, ...reportUrls];
}
