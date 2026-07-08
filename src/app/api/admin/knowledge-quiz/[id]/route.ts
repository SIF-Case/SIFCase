import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import KnowledgeQuiz from "@/models/KnowledgeQuiz";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasPageAccess(req, "suitability", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  
  const update: Record<string, unknown> = {};
  if (typeof body.question === "string") update.question = body.question;
  if (Array.isArray(body.options)) update.options = body.options;
  if (typeof body.context === "string") update.context = body.context;
  if (typeof body.points === "number") update.points = body.points;
  if (typeof body.order === "number") update.order = body.order;
  if (typeof body.published === "boolean") update.published = body.published;
  
  await KnowledgeQuiz.findByIdAndUpdate(id, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await hasPageAccess(req, "suitability", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await connectDB();
  const { id } = await params;
  await KnowledgeQuiz.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
