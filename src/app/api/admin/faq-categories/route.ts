import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import FaqCategory from "@/models/FaqCategory";
import Faq from "@/models/Faq";

async function getOrCreate() {
  let doc = await FaqCategory.findOne({}).lean();
  if (!doc) {
    const created = new FaqCategory({});
    await created.save();
    doc = created.toObject();
  }
  return doc;
}

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "faqs", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const doc = await getOrCreate();
  return NextResponse.json({ categories: doc.categories });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "faqs", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { action, value, oldValue, order } = await req.json() as {
    action: "add" | "rename" | "delete" | "reorder";
    value?: string;
    oldValue?: string;
    order?: string[];
  };

  const doc = await getOrCreate();

  if (action === "add") {
    const v = (value ?? "").trim();
    if (!v || doc.categories.includes(v)) return NextResponse.json({ error: "Already exists" }, { status: 400 });
    await FaqCategory.updateOne({}, { $push: { categories: v } }, { upsert: true });
  }

  if (action === "rename" && oldValue) {
    const v = (value ?? "").trim();
    if (!v || doc.categories.includes(v)) return NextResponse.json({ error: "Already exists" }, { status: 400 });
    const cats = doc.categories.map((c) => (c === oldValue ? v : c));
    await FaqCategory.updateOne({}, { $set: { categories: cats } }, { upsert: true });
    await Faq.updateMany({ category: oldValue }, { $set: { category: v } });
  }

  if (action === "delete" && value) {
    const cats = doc.categories.filter((c) => c !== value);
    await FaqCategory.updateOne({}, { $set: { categories: cats } }, { upsert: true });
    await Faq.updateMany({ category: value }, { $set: { category: "General" } });
  }

  if (action === "reorder" && Array.isArray(order)) {
    await FaqCategory.updateOne({}, { $set: { categories: order } }, { upsert: true });
  }

  const updated = await getOrCreate();
  return NextResponse.json({ categories: updated.categories });
}
