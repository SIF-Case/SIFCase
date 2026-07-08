import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import KnowledgeQuiz from "@/models/KnowledgeQuiz";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "suitability", "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await connectDB();
  const questions = await KnowledgeQuiz.find().sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "suitability", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await connectDB();
  const body = await req.json();
  const { question, options, context, points, order, published } = body;
  
  if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 });
  if (!Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
  }
  
  const hasCorrectAnswer = options.some(opt => opt.isCorrect);
  if (!hasCorrectAnswer) {
    return NextResponse.json({ error: "At least one correct answer required" }, { status: 400 });
  }
  
  const quiz = await KnowledgeQuiz.create({
    question,
    options,
    context: context || "",
    points: points || 10,
    order: order || 0,
    published: published !== false,
  });
  
  return NextResponse.json({ ok: true, id: quiz._id });
}
