import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { TopicDetailClient } from "./TopicDetailClient";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";

// Revalidate on-demand only (via revalidatePath calls from admin)
export const revalidate = false;

export async function generateStaticParams() {
  await connectDB();
  const articles = await Article.find({ 
    status: "published", 
    subcategory: "SIF Education" 
  })
    .select("slug")
    .lean();
  return articles.map((a: any) => ({ topicId: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  await connectDB();
  const article = await Article.findOne({ 
    slug: topicId, 
    status: "published", 
    subcategory: "SIF Education" 
  })
    .select("title excerpt")
    .lean();
  if (!article) return {};
  return {
    title: `${article.title} — SIF 101 | SIFcase`,
    description: article.excerpt || "",
  };
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  
  await connectDB();
  
  // Fetch all published SIF Education articles for navigation
  const allArticles = await Article.find({ 
    status: "published", 
    subcategory: "SIF Education" 
  })
    .sort({ order: 1, publishedAt: -1 })
    .select("slug title excerpt readTime")
    .lean();
  
  // Find current article
  const currentArticle = await Article.findOne({ 
    slug: topicId, 
    status: "published", 
    subcategory: "SIF Education" 
  })
    .select("slug title excerpt content readTime publishedAt tags")
    .lean();
    
  if (!currentArticle) notFound();

  // Fetch related articles from "Article" category (Insight tab) - different from current article
  const relatedArticlesRaw = await Article.find({
    status: "published",
    category: "Article",
    slug: { $ne: topicId },
  })
    .sort({ publishedAt: -1 })
    .limit(4)
    .select("slug title")
    .lean();

  const tickerNavs = await getTickerNavs();

  // Convert to plain objects
  const articles = allArticles.map((a: any) => ({
    _id: String(a._id),
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || "",
    readTime: a.readTime || 5,
  }));

  const article = {
    _id: String(currentArticle._id),
    slug: currentArticle.slug,
    title: currentArticle.title,
    excerpt: currentArticle.excerpt || "",
    content: currentArticle.content || "",
    readTime: currentArticle.readTime || 5,
    publishedAt: currentArticle.publishedAt ? String(currentArticle.publishedAt) : null,
  };

  const relatedArticles = relatedArticlesRaw.map((a: any) => ({
    slug: a.slug,
    title: a.title,
  }));

  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />
      <TopicDetailClient topicId={topicId} article={article} allArticles={articles} relatedArticles={relatedArticles} />
      <Footer />
    </main>
  );
}
