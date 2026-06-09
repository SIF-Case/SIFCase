import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import NewsItem from "@/models/NewsItem";
import Article from "@/models/Article";
import slugify from "slugify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  if (body.action === "promote") {
    const item = await NewsItem.findById(id).lean();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (item.promotedArticleId) return NextResponse.json({ error: "Already promoted", articleId: item.promotedArticleId });

    let slug = slugify(item.title, { lower: true, strict: true });
    const existing = await Article.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const wordCount = item.aiSummary.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 265));

    const article = await Article.create({
      title: item.title,
      slug,
      excerpt: item.aiSummary || item.originalExcerpt,
      content: `<p>${item.aiSummary || item.originalExcerpt}</p><p><a href="${item.url}" target="_blank" rel="noopener">Read original article →</a></p>`,
      coverDesktop: item.imageUrl,
      category: "News",
      tags: item.tags,
      status: "draft",
      readTime,
      publishedAt: null,
    });

    await NewsItem.findByIdAndUpdate(id, { promotedArticleId: article._id });
    return NextResponse.json({ ok: true, articleId: article._id });
  }

  // Toggle visibility or update fields
  const update: Record<string, unknown> = {};
  if (typeof body.isVisible === "boolean") update.isVisible = body.isVisible;
  if (typeof body.aiSummary === "string") update.aiSummary = body.aiSummary;

  await NewsItem.findByIdAndUpdate(id, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  await NewsItem.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
