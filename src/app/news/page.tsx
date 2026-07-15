import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TickerRibbon } from "@/components/sections/TickerRibbon";
import { getTickerNavs } from "@/lib/sifData";
import { FundHousesNewsClient } from "@/components/sections/FundHousesNewsClient";

// No revalidate - will use on-demand revalidation from API

export const metadata = {
  title: "Latest SIF News - SIFcase",
  description: "Stay updated with the latest news and developments in the Specialised Investment Fund industry.",
};

async function getPublishedNews(brand?: string) {
  await connectDB();

  // Get General News articles - fetch all, no limit
  const generalNews = await Article.find({
    status: "published",
    category: "General News",
    ...(brand ? { subcategory: brand } : {}),
  })
    .sort({ publishedAt: -1 })
    .select("title slug excerpt subcategory publishedAt readTime category")
    .lean();

  // Get Fund Houses articles - fetch all, no limit
  const fundHousesNews = await Article.find({
    status: "published",
    category: "Fund Houses",
    ...(brand ? { subcategory: brand } : {}),
  })
    .sort({ publishedAt: -1 })
    .select("title slug excerpt subcategory publishedAt readTime category")
    .lean();

  return { generalNews, fundHousesNews };
}

type Props = { searchParams: Promise<{ brand?: string }> };

export default async function NewsPage({ searchParams }: Props) {
  const { brand } = await searchParams;
  const [newsData, tickerNavs] = await Promise.all([
    getPublishedNews(brand),
    getTickerNavs(),
  ]);

  const { generalNews, fundHousesNews } = newsData;

  return (
    <main className="flex flex-col min-h-screen bg-[#F4F6FA]">
      <TickerRibbon navItems={tickerNavs} />
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20 w-full flex-1">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-primary mb-2">Latest Updates</p>
          <h1 className="text-[42px] font-bold text-[#0B1F3A] tracking-[-1px] leading-none mb-3">
            {brand ? `${brand} News` : "SIF News"}
          </h1>
          <p className="text-[16px] text-[#64748B]">
            {brand
              ? `Latest news and developments for ${brand}.`
              : "Stay updated with the latest news and developments in the Specialised Investment Fund industry."}
          </p>
          {brand && (
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-medium text-primary hover:text-primary-hover"
            >
              ← View all news
            </Link>
          )}
        </div>

        {/* News Grid */}
        {generalNews.length === 0 && fundHousesNews.length === 0 ? (
          <div className="py-24 text-center text-[#64748B] text-[15px]">
            {brand ? `No news articles found for ${brand}.` : "No news articles available at the moment."}
          </div>
        ) : (
          <>
            {/* General News Section */}
            {generalNews.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-[28px] font-bold text-heading tracking-tight">General News</h2>
                  <div className="flex-1 h-px bg-rule"></div>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {generalNews.map((article) => (
                    <Link
                      key={article._id.toString()}
                      href={`/news/${article.slug}`}
                      className="group flex flex-col bg-white rounded-[18px] border border-rule p-5 shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow"
                    >
                      <div className="flex flex-col flex-1">
                        {/* Category & Read Time */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary truncate max-w-[140px]">
                            {article.subcategory || "General"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-faint">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {article.readTime || 3} min
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">
                          {article.excerpt || "Click to read the full article."}
                        </p>

                        {/* Footer: Date & Read Arrow */}
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-faint">
                            {article.publishedAt
                              ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all">
                            Read <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Fund Houses News Section */}
            {fundHousesNews.length > 0 && (
              <FundHousesNewsClient 
                articles={fundHousesNews.map(a => ({
                  _id: a._id.toString(),
                  title: a.title,
                  slug: a.slug,
                  excerpt: a.excerpt,
                  subcategory: a.subcategory,
                  publishedAt: a.publishedAt ? (a.publishedAt as any).toISOString() : undefined,
                  readTime: a.readTime,
                  category: a.category
                }))}
              />
            )}
          </>
        )}

        {/* Link to In-depth Articles */}
        <div className="mt-14 text-center">
          <Link
            href="/read"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-primary hover:text-primary-hover"
          >
            View In-depth Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
