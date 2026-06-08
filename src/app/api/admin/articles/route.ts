import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = searchParams.get("all") === "1" ? 500 : 20;
  const [articles, total] = await Promise.all([
    Article.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Article.countDocuments(),
  ]);
  return NextResponse.json({ articles, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const {
    title, content, excerpt, coverDesktop, coverMobile, useSeparateMobile,
    category, subcategory, tags, status, authorName, authorBio,
    seoTitle, metaDescription, canonicalUrl, robotsIndex, ogImage, primaryKeyword, focusKeyphrase,
  } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  let slug = slugify(title, { lower: true, strict: true });
  const existing = await Article.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;

  const wordCount = content?.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length ?? 0;
  const estimatedRead = Math.max(1, Math.round(wordCount / 265));

  const article = await Article.create({
    title, slug, content, excerpt, coverDesktop, coverMobile,
    useSeparateMobile: !!useSeparateMobile,
    category: category || "General",
    subcategory: subcategory || "",
    tags: tags || [],
    status: status || "draft",
    authorName: authorName || "SIFcase Team",
    authorBio: authorBio || "",
    readTime: estimatedRead,
    publishedAt: status === "published" ? new Date() : null,
    seoTitle: seoTitle || "",
    metaDescription: metaDescription || "",
    canonicalUrl: canonicalUrl || "",
    robotsIndex: robotsIndex !== false,
    ogImage: ogImage || "",
    primaryKeyword: primaryKeyword || "",
    focusKeyphrase: focusKeyphrase || "",
  });
  return NextResponse.json({ ok: true, id: article._id, slug: article.slug });
}
