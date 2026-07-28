export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import ArticleOptions from "@/models/ArticleOptions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { ArticleCard } from "@/app/read/page";
import type { ArticleDoc } from "@/app/read/page";
import slugify from "slugify";

type Props = { params: Promise<{ slug: string }> };

// Both this page and its metadata scan every published article to resolve a
// subcategory slug — prerendering the known slugs keeps that off the request path.
export async function generateStaticParams() {
  await connectDB();
  const optionsDoc = await ArticleOptions.findOne({}).lean();
  const mainCategory = optionsDoc?.categories?.[0] ?? "General";
  const articles = await Article.find({ status: "published", category: mainCategory }, "subcategory").lean();
  const slugs = new Set(
    articles.map((a) => slugify(a.subcategory?.trim() || mainCategory, { lower: true, strict: true })),
  );
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  
  const optionsDoc = await ArticleOptions.findOne({}).lean();
  const mainCategory = optionsDoc?.categories?.[0] ?? "General";

  const articles = await Article.find({ status: "published", category: mainCategory }).lean();
  const matched = articles.find(a => {
    const sub = a.subcategory?.trim() || mainCategory;
    return slugify(sub, { lower: true, strict: true }) === slug;
  });

  if (!matched) return { title: "Subcategory Not Found" };

  const subName = matched.subcategory?.trim() || mainCategory;
  return {
    title: `${subName} — SIFcase`,
    description: `Articles and insights about ${subName} on SIFcase.`,
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { slug } = await params;
  await connectDB();
  
  const optionsDoc = await ArticleOptions.findOne({}).lean();
  const mainCategory = optionsDoc?.categories?.[0] ?? "General";

  const articles = (await Article.find({ status: "published", category: mainCategory })
    .sort({ order: 1, publishedAt: -1 })
    .lean()) as unknown as ArticleDoc[];

  const filteredArticles = articles.filter(a => {
    const sub = a.subcategory?.trim() || mainCategory;
    return slugify(sub, { lower: true, strict: true }) === slug;
  });

  if (filteredArticles.length === 0) {
    notFound();
  }

  const subName = filteredArticles[0].subcategory?.trim() || mainCategory;
  
  return (
    <main className="flex flex-col min-h-screen bg-[#F4F6FA]">
      <Navbar />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-12 pb-20 w-full flex-1">
        
        {/* Back Link & Header */}
        <div className="mb-10">
          <Link href="/read" className="inline-flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#0B1F3A] transition-colors mb-6">
            <ArrowLeft className="size-3.5" /> Back to Read
          </Link>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-primary mb-2">Category: {subName}</p>
          <h1 className="text-[36px] font-bold text-[#0B1F3A] tracking-[-0.8px] leading-tight mb-2">
            {subName}
          </h1>
          <p className="text-[15px] text-[#64748B]">Showing all articles under {subName}.</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredArticles.map((a) => (
            <ArticleCard key={String(a._id)} a={a} />
          ))}
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
