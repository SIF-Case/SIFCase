// Revalidate on-demand only (via revalidatePath calls)
export const revalidate = false;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { LearningHubClient } from "./LearningHubClient";

export const metadata = {
  title: "SIF 101 — Learning Hub | SIFcase",
  description:
    "Build confidence before you invest. Bite-sized articles on SIF products, mechanics, risk, regulation and tax.",
};

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
