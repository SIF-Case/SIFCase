export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Read — SIFcase",
  description: "Insights, education, and analysis on Specialised Investment Funds.",
};

export default async function ReadPage() {
  await connectDB();
  const articles = await Article.find({ status: "published" }).sort({ publishedAt: -1 }).lean();

  const [featured, ...rest] = articles;

  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1080px] mx-auto px-6 py-14 w-full flex-1">
        <div className="mb-12 border-b border-[#E5E5E5] pb-6">
          <h1 className="text-[42px] font-bold text-[#1a1a1a] tracking-[-0.5px]">Read</h1>
          <p className="text-[17px] text-[#6B6B6B] mt-2">Insights and education on Specialised Investment Funds.</p>
        </div>

        {articles.length === 0 ? (
          <div className="py-24 text-center text-[#6B6B6B] text-[16px]">No articles published yet.</div>
        ) : (
          <div className="space-y-0">
            {/* Featured first article — big */}
            {featured && (
              <Link href={`/read/${featured.slug}`} className="group block mb-12 pb-12 border-b border-[#E5E5E5]">
                <div className="grid sm:grid-cols-[1fr_260px] gap-8 items-start">
                  <div>
                    <p className="text-[12px] font-mono uppercase tracking-widest text-primary mb-3">{featured.category}</p>
                    <h2 className="text-[28px] font-bold text-[#1a1a1a] leading-[1.22] tracking-[-0.3px] mb-3 group-hover:text-primary transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && <p className="text-[16px] text-[#6B6B6B] leading-[1.55] line-clamp-3 mb-4">{featured.excerpt}</p>}
                    <div className="flex items-center gap-3 text-[13px] text-[#9B9B9B]">
                      <span className="font-medium text-[#3d3d3d]">{featured.authorName}</span>
                      <span>·</span>
                      <span>{featured.readTime} min read</span>
                      {featured.publishedAt && (
                        <><span>·</span><span>{new Date(featured.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></>
                      )}
                    </div>
                  </div>
                  {(featured.coverDesktop || featured.coverMobile) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.coverDesktop || featured.coverMobile}
                      alt={featured.title}
                      className="w-full h-44 object-cover rounded-[4px] shrink-0"
                    />
                  )}
                </div>
              </Link>
            )}

            {/* Rest — compact rows */}
            {rest.map((a, i) => (
              <Link key={String(a._id)} href={`/read/${a.slug}`}
                className={`group flex items-start justify-between gap-8 py-8 ${i < rest.length - 1 ? "border-b border-[#E5E5E5]" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-2">{a.category}</p>
                  <h2 className="text-[18px] font-bold text-[#1a1a1a] leading-snug tracking-[-0.2px] mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                    {a.title}
                  </h2>
                  {a.excerpt && <p className="text-[14px] text-[#6B6B6B] line-clamp-2 mb-3">{a.excerpt}</p>}
                  <div className="flex items-center gap-2 text-[12px] text-[#9B9B9B]">
                    <span className="font-medium text-[#6B6B6B]">{a.authorName}</span>
                    <span>·</span>
                    <span>{a.readTime} min read</span>
                    {a.publishedAt && (
                      <><span>·</span><span>{new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></>
                    )}
                  </div>
                </div>
                {(a.coverDesktop || a.coverMobile) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.coverDesktop || a.coverMobile}
                    alt={a.title}
                    className="w-28 h-20 object-cover rounded-[4px] shrink-0"
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
