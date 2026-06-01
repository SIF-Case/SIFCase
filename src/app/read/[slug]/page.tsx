export const revalidate = 60;

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const a = await Article.findOne({ slug, status: "published" }).lean();
  if (!a) return { title: "Not found" };

  const title = a.seoTitle || a.title;
  const description = a.metaDescription || a.excerpt;
  const ogImg = a.ogImage || a.coverDesktop;
  const url = `https://sifcase.in/read/${slug}`;

  return {
    title: `${title} — SIFcase`,
    description,
    robots: a.robotsIndex ? "index, follow" : "noindex, nofollow",
    alternates: { canonical: a.canonicalUrl || url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: a.updatedAt?.toISOString(),
      authors: [a.authorName],
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImg ? [ogImg] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  await connectDB();
  const article = await Article.findOne({ slug, status: "published" }).lean();
  if (!article) notFound();

  const publishDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const pageUrl = `https://sifcase.in/read/${slug}`;
  const ogImg = article.ogImage || article.coverDesktop;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    image: ogImg || undefined,
    author: { "@type": "Person", name: article.authorName },
    publisher: { "@type": "Organization", name: "SIFcase", logo: { "@type": "ImageObject", url: "https://sifcase.in/logo.png" } },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": article.canonicalUrl || pageUrl },
    keywords: [...(article.tags ?? []), article.primaryKeyword, article.focusKeyphrase].filter(Boolean).join(", "),
    articleSection: article.category,
    wordCount: article.content.replace(/<[^>]+>/g, "").split(/\s+/).length,
    timeRequired: `PT${article.readTime}M`,
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Article */}
      <div className="flex-1">
        {/* Header — centered, max 680px */}
        <header className="max-w-[1000px] mx-auto px-6 pt-12 pb-8">
          {/* Back + category */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/read" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-body transition-colors">
              <ArrowLeft className="size-3.5" /> Read
            </Link>
            <span className="text-rule">·</span>
            <span className="text-[12px] font-mono uppercase tracking-widest text-primary">{article.category}</span>
          </div>

          {/* Title */}
          <h1 className="text-[38px] sm:text-[44px] font-bold text-[#1a1a1a] leading-[1.18] tracking-[-0.5px] mb-5">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-[20px] text-[#6B6B6B] leading-[1.58] mb-8 font-normal">
              {article.excerpt}
            </p>
          )}

          {/* Author row */}
          <div className="flex items-center gap-3 pb-6 border-b border-[#E5E5E5]">
            <div className="size-10 rounded-full bg-brand-navy flex items-center justify-center text-white text-[14px] font-bold shrink-0">
              {article.authorName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">{article.authorName}</p>
              <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B]">
                {publishDate && <span>{publishDate}</span>}
                <span>·</span>
                <span>{article.readTime} min read</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover image — full bleed up to a wide max */}
        {(article.coverDesktop || article.coverMobile) && (
          <div className="max-w-[1000px] mx-auto px-6 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverDesktop || article.coverMobile}
              alt={article.title}
              className={`w-full rounded-[4px] object-cover max-h-[520px] ${article.useSeparateMobile && article.coverMobile ? "hidden sm:block" : ""}`}
            />
            {article.useSeparateMobile && article.coverMobile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.coverMobile} alt={article.title} className="w-full rounded-[4px] object-cover max-h-[360px] sm:hidden" />
            )}
          </div>
        )}

        {/* Body content */}
        <article
          className="max-w-[1000px] mx-auto px-6 pb-16 article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Author bio */}
        {article.authorBio && (
          <div className="max-w-[1000px] mx-auto px-6 pb-8">
            <div className="border-t border-[#E5E5E5] pt-8 flex items-start gap-4">
              <div className="size-12 rounded-full bg-brand-navy flex items-center justify-center text-white text-[16px] font-bold shrink-0">
                {article.authorName[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1a1a1a]">{article.authorName}</p>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed mt-0.5">{article.authorBio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="max-w-[1000px] mx-auto px-6 pb-12 flex flex-wrap gap-2 border-t border-[#E5E5E5] pt-8">
            {article.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full bg-[#F2F2F2] text-[#6B6B6B] hover:bg-[#E6E6E6] transition-colors cursor-pointer">
                <Tag className="size-3" />{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Medium-style article typography */}
      <style>{`
        .article-body {
          font-family: var(--font-inter), "Inter", sans-serif;
          font-size: 18px;
          line-height: 1.75;
          color: #1a1a1a;
          letter-spacing: -0.01em;
        }
        .article-body p { margin: 0 0 1.4em; }
        .article-body h1 { font-size: 34px; font-weight: 700; line-height: 1.2; margin: 1.8em 0 0.6em; letter-spacing: -0.5px; font-family: var(--font-inter), "Inter", sans-serif; }
        .article-body h2 { font-size: 26px; font-weight: 700; line-height: 1.25; margin: 1.8em 0 0.6em; letter-spacing: -0.3px; font-family: var(--font-inter), "Inter", sans-serif; }
        .article-body h3 { font-size: 20px; font-weight: 700; line-height: 1.3; margin: 1.6em 0 0.5em; font-family: var(--font-inter), "Inter", sans-serif; }
        .article-body strong { font-weight: 600; color: #1a1a1a; }
        .article-body em { font-style: italic; }
        .article-body a { color: inherit; text-decoration: underline; text-decoration-color: #999; text-underline-offset: 3px; }
        .article-body a:hover { text-decoration-color: #1a1a1a; }
        .article-body blockquote { border-left: 3px solid #1a1a1a; margin: 2em 0; padding: 0 0 0 28px; font-style: italic; color: #3d3d3d; font-size: 20px; }
        .article-body ul { list-style: disc; padding-left: 28px; margin: 1em 0 1.4em; }
        .article-body ol { list-style: decimal; padding-left: 28px; margin: 1em 0 1.4em; }
        .article-body li { margin-bottom: 0.4em; }
        .article-body code { font-family: "Courier New", monospace; font-size: 0.85em; background: #F2F2F2; padding: 2px 6px; border-radius: 4px; color: #c7254e; }
        .article-body pre { background: #F8F8F8; border-radius: 6px; padding: 20px; overflow-x: auto; font-size: 15px; line-height: 1.6; margin: 1.5em 0; }
        .article-body img { max-width: 100%; border-radius: 4px; margin: 2em auto; display: block; }
        .article-body hr { border: none; border-top: 1px solid #E5E5E5; margin: 3em auto; width: 30%; }
        .article-body mark { background: #FFEB3B; padding: 0 2px; border-radius: 2px; }
        .article-body table { border-collapse: collapse; width: 100%; margin: 1.5em 0; font-size: 16px; font-family: var(--font-inter), "Inter", sans-serif; }
        .article-body td, .article-body th { border: 1px solid #E5E5E5; padding: 10px 16px; vertical-align: top; text-align: left; }
        .article-body th { background: #F8F8F8; font-weight: 600; color: #1a1a1a; }
        .article-body tr:nth-child(even) td { background: #FAFAFA; }
      `}</style>
    </main>
  );
}
