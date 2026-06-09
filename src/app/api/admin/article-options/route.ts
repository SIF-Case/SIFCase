import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import ArticleOptions from "@/models/ArticleOptions";

async function getOrCreate() {
  let doc = await ArticleOptions.findOne({}).lean();
  if (!doc) {
    const created = new ArticleOptions({});
    await created.save();
    doc = created.toObject();
  }
  return doc;
}

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const doc = await getOrCreate();
  return NextResponse.json({ categories: doc.categories, subcategories: doc.subcategories });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { action, category, value, oldValue, order } = await req.json() as {
    action: "add_category" | "add_subcategory" | "rename_category" | "rename_subcategory" | "reorder_categories" | "reorder_subcategories";
    category?: string;
    value: string;
    oldValue?: string;
    order?: string[];
  };

  const doc = await getOrCreate();

  if (action === "add_category") {
    const v = value.trim();
    if (!v || doc.categories.includes(v)) return NextResponse.json({ error: "Already exists" }, { status: 400 });
    await ArticleOptions.updateOne({}, { $push: { categories: v }, $set: { [`subcategories.${v}`]: [] } }, { upsert: true });
  }

  if (action === "add_subcategory") {
    const v = value.trim();
    const cat = (category ?? "").trim();
    if (!v || !cat) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const subs: string[] = (doc.subcategories as Record<string, string[]>)[cat] ?? [];
    if (subs.includes(v)) return NextResponse.json({ error: "Already exists" }, { status: 400 });
    await ArticleOptions.updateOne({}, { $push: { [`subcategories.${cat}`]: v } }, { upsert: true });
  }

  if (action === "rename_category" && oldValue) {
    const v = value.trim();
    if (!v || doc.categories.includes(v)) return NextResponse.json({ error: "Already exists" }, { status: 400 });
    const cats = doc.categories.map((c) => (c === oldValue ? v : c));
    const subs = { ...(doc.subcategories as Record<string, string[]>) };
    if (subs[oldValue]) { subs[v] = subs[oldValue]; delete subs[oldValue]; }
    await ArticleOptions.updateOne({}, { $set: { categories: cats, subcategories: subs } }, { upsert: true });
  }

  if (action === "reorder_categories" && Array.isArray(order)) {
    await ArticleOptions.updateOne({}, { $set: { categories: order } }, { upsert: true });
  }

  if (action === "reorder_subcategories" && Array.isArray(order) && category) {
    await ArticleOptions.updateOne({}, { $set: { [`subcategories.${category}`]: order } }, { upsert: true });
  }

  if (action === "rename_subcategory" && oldValue && category) {
    const v = value.trim();
    const cat = category.trim();
    const subs = { ...(doc.subcategories as Record<string, string[]>) };
    subs[cat] = (subs[cat] ?? []).map((s) => (s === oldValue ? v : s));
    await ArticleOptions.updateOne({}, { $set: { [`subcategories.${cat}`]: subs[cat] } }, { upsert: true });
  }

  const updated = await getOrCreate();
  return NextResponse.json({ categories: updated.categories, subcategories: updated.subcategories });
}
