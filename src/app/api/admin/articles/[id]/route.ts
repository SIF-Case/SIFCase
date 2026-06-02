import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const article = await Article.findById(id).lean();
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  if (body.status === "published") {
    const existing = await Article.findById(id);
    if (existing && !existing.publishedAt) body.publishedAt = new Date();
  }

  const wordCount = body.content?.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length ?? 0;
  body.readTime = Math.max(1, Math.round(wordCount / 265));

  const article = await Article.findByIdAndUpdate(id, body, { returnDocument: "after" });
  return NextResponse.json({ ok: true, slug: article?.slug });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  await Article.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
