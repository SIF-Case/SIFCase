import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!await hasPageAccess(req, "articles", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const article = await Article.findById(id).lean();
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  
  try {
    const body = await req.json();

    // Grab the pre-update state ONCE — we need it for publishedAt AND revalidation diffing
    const existing = await Article.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // If title changed, regenerate slug
    if (body.title && body.title !== existing.title) {
      let newSlug = slugify(body.title, { lower: true, strict: true });
      
      // Check if new slug conflicts with another article (excluding current one)
      const conflictingArticle = await Article.findOne({ 
        slug: newSlug, 
        _id: { $ne: existing._id } 
      });
      
      if (conflictingArticle) {
        // Append timestamp to make it unique
        newSlug = `${newSlug}-${Date.now()}`;
      }
      
      body.slug = newSlug;
    }

    // Only auto-set publishedAt on first publish; if the editor sent an explicit date, use that
    if (body.status === "published" && !existing.publishedAt && !body.publishedAt) {
      body.publishedAt = new Date();
    } else if (body.publishedAt) {
      // Allow explicit date override from the editor
      body.publishedAt = new Date(body.publishedAt);
    }

    if (body.content) {
      const wordCount = body.content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
      body.readTime = Math.max(1, Math.round(wordCount / 265));
    }

    const article = await Article.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // ── Revalidation: compare OLD vs NEW state, not just new ──
    const wasPublished = existing.status === "published";
    const isPublished = article.status === "published";
    const wasSifEdu = existing.category === "SIF Education";
    const isSifEdu = article.category === "SIF Education";
    const wasNews = existing.category === "General News" || existing.category === "Fund Houses";
    const isNews = article.category === "General News" || article.category === "Fund Houses";
    const slugChanged = existing.slug !== article.slug;

    // News listing: revalidate if it was news, is news, or status changed either way
    if ((wasNews && wasPublished) || (isNews && isPublished)) {
      revalidatePath("/news");
    }

    // SIF 101 hub: revalidate if it WAS in SIF Education+published, OR IS now
    if ((wasSifEdu && wasPublished) || (isSifEdu && isPublished)) {
      revalidatePath("/sif-101");
    }

    // SIF 101 detail page: revalidate old slug if it was SIF Education+published (covers removal/move)
    if (wasSifEdu && wasPublished) {
      revalidatePath(`/sif-101/${existing.slug}`);
    }
    // Always revalidate new slug if it IS now SIF Education+published (covers creates, moves in, and content edits)
    if (isSifEdu && isPublished) {
      revalidatePath(`/sif-101/${article.slug}`);
    }

    // /read/[slug] page — same old/new + published logic
    if (wasPublished) revalidatePath(`/read/${existing.slug}`);
    if (isPublished && slugChanged) revalidatePath(`/read/${article.slug}`);

    return NextResponse.json({ ok: true, slug: article.slug });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: error.message || "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  
  const article = await Article.findById(id);
  if (article) {
    // Revalidate before deleting
    if (article.status === "published") {
      if (article.category === "General News" || article.category === "Fund Houses") {
        revalidatePath("/news");
      }
      if (article.category === "SIF Education") {
        revalidatePath("/sif-101");
      }
      revalidatePath(`/read/${article.slug}`);
    }
  }
  
  await Article.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
