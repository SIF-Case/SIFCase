import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import slugify from "slugify";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = searchParams.get("all") === "1" ? 500 : 20;
  const [articles, total] = await Promise.all([
    Article.find().sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Article.countDocuments(),
  ]);
  return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  
  try {
    const body = await req.json();
    const {
      title, content, excerpt, coverDesktop, coverMobile, useSeparateMobile,
      category, subcategory, tags, status, authorName, authorBio, publishedAt,
      seoTitle, metaDescription, canonicalUrl, robotsIndex, ogImage, primaryKeyword, focusKeyphrase,
    } = body;
    
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true });
    const existing = await Article.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Calculate read time
    const wordCount = content?.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length ?? 0;
    const estimatedRead = Math.max(1, Math.round(wordCount / 265));

    // Create article
    const article = await Article.create({
      title,
      slug,
      content: content || "",
      excerpt: excerpt || "",
      coverDesktop: coverDesktop || "",
      coverMobile: coverMobile || "",
      useSeparateMobile: !!useSeparateMobile,
      category: category || "",
      subcategory: subcategory || "",
      tags: tags || [],
      status: status || "draft",
      authorName: authorName || "SIFcase Team",
      authorBio: authorBio || "",
      readTime: estimatedRead,
      // Use explicit publishedAt if provided, otherwise auto-set on publish
      publishedAt: publishedAt ? new Date(publishedAt) : (status === "published" ? new Date() : null),
      seoTitle: seoTitle || "",
      metaDescription: metaDescription || "",
      canonicalUrl: canonicalUrl || "",
      robotsIndex: robotsIndex !== false,
      ogImage: ogImage || "",
      primaryKeyword: primaryKeyword || "",
      focusKeyphrase: focusKeyphrase || "",
    });
    
    // Revalidate relevant pages immediately if published
    if (article.status === "published") {
      if (article.category === "General News" || article.category === "Fund Houses") {
        revalidatePath("/news");
      }
      if (article.category === "SIF Education") {
        revalidatePath("/sif-101");
        revalidatePath(`/sif-101/${article.slug}`);
      }
      revalidatePath(`/read/${article.slug}`);
    }
    
    return NextResponse.json({ ok: true, id: article._id, slug: article.slug });
  } catch (error: any) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: error.message || "Failed to create article" }, { status: 500 });
  }
}
