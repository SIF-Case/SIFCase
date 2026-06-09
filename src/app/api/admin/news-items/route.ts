import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import NewsItem from "@/models/NewsItem";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const source = searchParams.get("source") ?? "";
  const visibility = searchParams.get("visibility") ?? "";
  const q = searchParams.get("q") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const filter: Record<string, unknown> = {};
  if (source) filter.source = source;
  if (visibility === "visible") filter.isVisible = true;
  if (visibility === "hidden") filter.isVisible = false;
  if (q) filter.$or = [
    { title: { $regex: q, $options: "i" } },
    { aiSummary: { $regex: q, $options: "i" } },
    { source: { $regex: q, $options: "i" } },
  ];
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); dateFilter.$lte = d; }
    filter.publishedAt = dateFilter;
  }

  const [items, total, sources] = await Promise.all([
    NewsItem.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    NewsItem.countDocuments(filter),
    NewsItem.distinct("source"),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit), sources });
}

export async function DELETE(req: NextRequest) {
  if (!await hasPageAccess(req, "news", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();

  if (body.clearAll === true) {
    const { deletedCount } = await NewsItem.deleteMany({});
    return NextResponse.json({ ok: true, deleted: deletedCount });
  }

  const { ids } = body;
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
  await NewsItem.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ ok: true });
}
