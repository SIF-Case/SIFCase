import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Faq from "@/models/Faq";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasPageAccess(req, "faqs", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (typeof body.question === "string") update.question = body.question;
  if (typeof body.answer === "string") update.answer = body.answer;
  if (typeof body.category === "string") update.category = body.category;
  if (typeof body.published === "boolean") update.published = body.published;
  if (typeof body.order === "number") update.order = body.order;

  await Faq.findByIdAndUpdate(id, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasPageAccess(req, "faqs", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  await Faq.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
