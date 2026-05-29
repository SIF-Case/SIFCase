export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import Link from "next/link";
import { Clock, User, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Read — SIFcase",
  description: "Insights, education, and analysis on Specialised Investment Funds.",
};

export default async function ReadPage() {
  await connectDB();
  const articles = await Article.find({ status: "published" }).sort({ publishedAt: -1 }).lean();

  return (
    <main className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-14 w-full flex-1">
        <div className="mb-10">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">Read</p>
          <h1 className="text-[36px] font-bold text-heading tracking-[-0.4px]">Insights & Education</h1>
          <p className="text-[16px] text-muted mt-2">Analysis, guides, and market perspectives on SIFs.</p>
        </div>

        {articles.length === 0 ? (
          <div className="py-24 text-center text-muted text-[15px]">No articles published yet. Check back soon.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <Link key={String(a._id)} href={`/read/${a.slug}`}
                className="group bg-white rounded-[18px] border border-rule shadow-card overflow-hidden hover:shadow-premium transition-shadow flex flex-col">
                {/* Cover */}
                {(a.coverDesktop || a.coverMobile) && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.coverDesktop || a.coverMobile}
                      alt={a.title}
                      className={`w-full h-44 object-cover ${a.useSeparateMobile && a.coverMobile ? "hidden sm:block" : ""}`}
                    />
                    {a.useSeparateMobile && a.coverMobile && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverMobile} alt={a.title} className="w-full h-44 object-cover sm:hidden" />
                    )}
                  </>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary">{a.category}</span>
                  </div>
                  <h2 className="text-[15.5px] font-bold text-heading leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">{a.title}</h2>
                  {a.excerpt && <p className="text-[13px] text-muted mt-2 line-clamp-2">{a.excerpt}</p>}
                  <div className="flex items-center gap-3 mt-4 text-[11px] text-faint">
                    <span className="flex items-center gap-1"><User className="size-3" />{a.authorName}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" />{a.readTime} min</span>
                    {a.publishedAt && <span>{new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                  </div>
                  {a.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {a.tags.slice(0, 3).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-surface border border-rule text-muted">
                          <Tag className="size-2.5" />{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
