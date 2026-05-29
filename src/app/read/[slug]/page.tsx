export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User, Calendar, Tag } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const article = await Article.findOne({ slug, status: "published" }).lean();
  if (!article) return { title: "Article not found" };
  return { title: `${article.title} — SIFcase`, description: article.excerpt };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  await connectDB();
  const article = await Article.findOne({ slug, status: "published" }).lean();
  if (!article) notFound();

  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Cover */}
      {(article.coverDesktop || article.coverMobile) && (
        <div className="w-full max-h-[480px] overflow-hidden bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverDesktop || article.coverMobile}
            alt={article.title}
            className={`w-full h-[420px] object-cover ${article.useSeparateMobile && article.coverMobile ? "hidden sm:block" : ""}`}
          />
          {article.useSeparateMobile && article.coverMobile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.coverMobile} alt={article.title} className="w-full h-[300px] object-cover sm:hidden" />
          )}
        </div>
      )}

      <article className="max-w-[740px] mx-auto px-6 py-12 w-full flex-1">
        {/* Back */}
        <Link href="/read" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-body mb-8">
          <ArrowLeft className="size-3.5" /> All articles
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted mb-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">{article.category}</span>
          <span className="flex items-center gap-1"><User className="size-3" />{article.authorName}</span>
          <span className="flex items-center gap-1"><Clock className="size-3" />{article.readTime} min read</span>
          {article.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        <h1 className="text-[34px] font-bold text-heading tracking-[-0.4px] leading-tight mb-4">{article.title}</h1>
        {article.excerpt && <p className="text-[17px] text-muted leading-relaxed mb-8 border-l-4 border-primary pl-4">{article.excerpt}</p>}

        {/* Content */}
        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-[12px] prose-blockquote:border-primary prose-code:bg-surface prose-code:px-1 prose-code:rounded text-[16px] leading-[1.8]"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-rule">
            {article.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-full bg-surface border border-rule text-muted">
                <Tag className="size-3" />{t}
              </span>
            ))}
          </div>
        )}
      </article>
      <Footer />
    </main>
  );
}
