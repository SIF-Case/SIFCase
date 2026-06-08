import { requirePageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { notFound } from "next/navigation";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAccess("articles", "edit");
  const { id } = await params;
  await connectDB();
  const article = await Article.findById(id).lean();
  if (!article) notFound();

  const a = article as typeof article & {
    subcategory?: string; authorBio?: string;
    seoTitle?: string; metaDescription?: string; canonicalUrl?: string;
    robotsIndex?: boolean; ogImage?: string; primaryKeyword?: string; focusKeyphrase?: string;
  };

  return (
    <ArticleEditor initial={{
      _id: String(a._id),
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      coverDesktop: a.coverDesktop,
      coverMobile: a.coverMobile,
      useSeparateMobile: a.useSeparateMobile,
      category: a.category,
      subcategory: a.subcategory ?? "",
      tags: a.tags.join(", "),
      status: a.status,
      authorName: a.authorName,
      authorBio: a.authorBio ?? "",
      readTime: a.readTime,
      slug: a.slug,
      seoTitle: a.seoTitle ?? "",
      metaDescription: a.metaDescription ?? "",
      canonicalUrl: a.canonicalUrl ?? "",
      robotsIndex: a.robotsIndex !== false,
      ogImage: a.ogImage ?? "",
      primaryKeyword: a.primaryKeyword ?? "",
      focusKeyphrase: a.focusKeyphrase ?? "",
    } as Parameters<typeof ArticleEditor>[0]["initial"]} />
  );
}
