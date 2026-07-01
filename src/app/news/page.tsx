import { connectDB } from "@/lib/mongodb";
import NewsItem from "@/models/NewsItem";
import { Newspaper, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Latest SIF News - SIFcase",
  description: "Stay updated with the latest news and developments in the Social Impact Fund industry.",
};

async function getVisibleNews() {
  await connectDB();
  const items = await NewsItem.find({ isVisible: true })
    .sort({ publishedAt: -1 })
    .limit(50)
    .lean();
  return items;
}

export default async function NewsPage() {
  const newsItems = await getVisibleNews();

  return (
    <main className="flex flex-col min-h-screen bg-[#F4F6FA]">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20 w-full flex-1">
        {/* Header matching Insights page */}
        <div className="mb-12">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-primary mb-2">Latest Updates</p>
          <h1 className="text-[42px] font-bold text-[#0B1F3A] tracking-[-1px] leading-none mb-3">SIF News</h1>
          <p className="text-[16px] text-[#64748B]">Stay updated with the latest news and developments in the Social Impact Fund industry.</p>
        </div>

        {/* News Grid - matching Insights card design */}
        {newsItems.length === 0 ? (
          <div className="py-24 text-center text-[#64748B] text-[15px]">No news items available at the moment.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newsItems.map((item) => (
              <article
                key={item._id.toString()}
                className="group flex flex-col bg-white rounded-[18px] border border-rule overflow-hidden shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow"
              >
                {/* Image with fixed height matching insights */}
                <div className="w-full h-[165px] bg-mist relative overflow-hidden">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="size-12 text-muted/20" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-5">
                  {/* Source & Read Time */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary">
                      {item.source}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-faint">
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      {item.aiSummary ? Math.max(1, Math.ceil(item.aiSummary.split(/\s+/).length / 200)) : 2} min
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">
                    {item.aiSummary || item.originalExcerpt || "Click to read the full article."}
                  </p>

                  {/* Footer: Date & Read Link */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-faint">
                      {new Date(item.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all"
                    >
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Link to Articles */}
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
