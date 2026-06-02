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

type ArticleDoc = {
  _id: unknown;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  subcategory: string;
  coverDesktop: string;
  coverMobile: string;
  authorName: string;
  readTime: number;
  publishedAt: Date | null;
};

function ArticleCard({ a }: { a: ArticleDoc }) {
  const cover = a.coverDesktop || a.coverMobile;
  return (
    <Link href={`/read/${a.slug}`}
      className="group flex flex-col rounded-[14px] border border-[#E2E8F0] bg-white overflow-hidden hover:shadow-[0_8px_32px_rgba(11,31,58,0.09)] transition-all duration-200">
      <div className="w-full h-[190px] bg-[#EEF2F7] shrink-0 overflow-hidden">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={a.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        )}
      </div>
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
        {a.subcategory && (
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.13em] text-primary mb-2.5">
            {a.subcategory}
          </p>
        )}
        <h3 className="text-[16.5px] font-bold text-[#0B1F3A] leading-[1.35] tracking-[-0.2px] mb-2.5 group-hover:text-primary transition-colors line-clamp-2">
          {a.title}
        </h3>
        {a.excerpt && (
          <p className="text-[13px] text-[#64748B] leading-[1.65] line-clamp-2 mb-4 flex-1">
            {a.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11.5px] text-[#94A3B8] mt-auto pt-3 border-t border-[#F1F5F9]">
          <span className="font-medium text-[#64748B]">{a.authorName}</span>
          <span>·</span>
          <span>{a.readTime} min read</span>
          {a.publishedAt && (
            <>
              <span>·</span>
              <span>{new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function ReadPage() {
  await connectDB();

  const articles = (await Article.find({ status: "published", category: "General" })
    .sort({ publishedAt: -1 })
    .lean()) as unknown as ArticleDoc[];

  const order: string[] = [];
  const grouped: Record<string, ArticleDoc[]> = {};
  for (const a of articles) {
    const sub = a.subcategory?.trim() || "General";
    if (!grouped[sub]) { grouped[sub] = []; order.push(sub); }
    grouped[sub].push(a);
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#F4F6FA]">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-8 pt-12 pb-20 w-full flex-1">

        {/* Page header — matches All SIFs style */}
        <div className="mb-12">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-primary mb-2">Insights</p>
          <h1 className="text-[42px] font-bold text-[#0B1F3A] tracking-[-1px] leading-none mb-3">Read</h1>
          <p className="text-[16px] text-[#64748B]">Insights and education on Specialised Investment Funds.</p>
        </div>

        {articles.length === 0 ? (
          <div className="py-24 text-center text-[#64748B] text-[15px]">No articles published yet.</div>
        ) : (
          <div className="space-y-14">
            {order.map((sub) => (
              <section key={sub}>
                {/* Plain dark sub-header */}
                <h2 className="text-[20px] font-bold text-[#0B1F3A] tracking-[-0.3px] mb-6 pb-4 border-b border-[#E2E8F0]">
                  {sub}
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grouped[sub].map((a) => (
                    <ArticleCard key={String(a._id)} a={a} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
