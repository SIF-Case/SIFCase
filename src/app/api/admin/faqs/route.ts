import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Faq from "@/models/Faq";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "faqs", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const faqs = await Faq.find().sort({ category: 1, order: 1, createdAt: 1 }).lean();
  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "faqs", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { question, answer, category, published } = body;
  if (!question || !answer) return NextResponse.json({ error: "Question and answer required" }, { status: 400 });

  const cat = category || "General";
  const last = await Faq.findOne({ category: cat }).sort({ order: -1 }).lean();
  const order = last ? last.order + 1 : 0;

  const faq = await Faq.create({
    question,
    answer,
    category: cat,
    order,
    published: published !== false,
  });
  return NextResponse.json({ ok: true, id: faq._id });
}
