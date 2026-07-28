import type { Metadata } from "next";
import { resolvePageMetadata } from "@/lib/pageSeo";
// Revalidate on-demand only (via revalidatePath calls)
export const revalidate = false;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { LearningHubClient } from "./LearningHubClient";

// Title/description/canonical come from the Page SEO admin screen when an
// override exists, otherwise from the defaults in src/lib/seoRegistry.ts.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/sif-101" });
}

export type SifEducationArticle = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  readTime: number;
  coverDesktop: string;
  coverMobile: string;
  publishedAt: string | null;
};

export default async function SIF101Page() {
  const tickerNavs = await getTickerNavs();

  // Fetch published articles with category "SIF Education"
  await connectDB();
  const rawArticles = await Article.find({ 
    status: "published", 
    category: "SIF Education" 
  })
    .sort({ order: 1, publishedAt: -1 })
    .select("slug title excerpt readTime coverDesktop coverMobile publishedAt")
    .lean();

  const sifEducationArticles: SifEducationArticle[] = rawArticles.map((a: any) => ({
    _id: String(a._id),
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || "",
    readTime: a.readTime || 5,
    coverDesktop: a.coverDesktop || "",
    coverMobile: a.coverMobile || "",
    publishedAt: a.publishedAt ? String(a.publishedAt) : null,
  }));

  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />
      <LearningHubClient sifEducationArticles={sifEducationArticles} />
      <Footer />
    </main>
  );
}
