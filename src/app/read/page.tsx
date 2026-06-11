export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, ArrowRight } from "lucide-react";
import slugify from "slugify";

export const metadata: Metadata = {
  title: "Read — SIFcase",
  description: "Insights, education, and analysis on Specialised Investment Funds.",
};

export type ArticleDoc = {
  _id: unknown;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  subcategory: string;
  order: number;
  coverDesktop: string;
  coverMobile: string;
  authorName: string;
  readTime: number;
  publishedAt: Date | null;
};

export function ArticleCard({ a }: { a: ArticleDoc }) {
  const cover = a.coverDesktop || a.coverMobile;
  return (
    <Link href={`/read/${a.slug}`}
      className="group flex flex-col bg-white rounded-[18px] border border-rule overflow-hidden shadow-card hover:shadow-premium hover:border-rule-strong transition-shadow">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="w-full h-[165px] object-cover bg-mist"
          loading="lazy"
        />
      )}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-4">
          {a.subcategory && (
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-primary-tint text-primary">
              {a.subcategory}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-faint">
            <Clock className="w-3 h-3" strokeWidth={2} />
            {a.readTime} min
          </span>
        </div>

        <h3 className="text-[14.5px] font-bold text-heading leading-snug mb-3 group-hover:text-primary line-clamp-2">
          {a.title}
        </h3>

        {a.excerpt && (
          <p className="text-[13px] text-body leading-relaxed flex-1 mb-3 line-clamp-3">{a.excerpt}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-[11px] text-faint">
            {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary group-hover:gap-2 transition-all">
            Read <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function ReadPage() {
  await connectDB();

  const articles = (await Article.find({ status: "published", category: "General" })
    .sort({ order: 1, publishedAt: -1 })
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

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20 w-full flex-1">

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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[20px] font-bold text-[#0B1F3A] tracking-[-0.3px]">
                    {sub}
                  </h2>
                  {grouped[sub].length > 4 && (
                    <Link
                      href={`/read/subcategory/${slugify(sub, { lower: true, strict: true })}`}
                      className="text-[13.5px] font-semibold text-primary hover:text-primary-hover"
                    >
                      View all &rarr;
                    </Link>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {grouped[sub].slice(0, 4).map((a) => (
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
