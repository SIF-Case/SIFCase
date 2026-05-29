import { requireAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { notFound } from "next/navigation";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const article = await Article.findById(id).lean();
  if (!article) notFound();

  return (
    <ArticleEditor initial={{
      _id: String(article._id),
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverDesktop: article.coverDesktop,
      coverMobile: article.coverMobile,
      useSeparateMobile: article.useSeparateMobile,
      category: article.category,
      tags: article.tags.join(", "),
      status: article.status,
      authorName: article.authorName,
      readTime: article.readTime,
      slug: article.slug,
    } as Parameters<typeof ArticleEditor>[0]["initial"]} />
  );
}
