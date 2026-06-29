import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SuitabilityQuestion from "@/models/SuitabilityQuestion";

// GET — list all questions (admin, no published filter)
export async function GET() {
  try {
    await connectDB();
    const questions = await SuitabilityQuestion.find()
      .sort({ dimensionOrder: 1, order: 1 })
      .lean();
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST — create new question
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { question, options, context, order, published } = body;

    if (!question?.trim()) return NextResponse.json({ error: "Question is required" }, { status: 400 });
    if (!Array.isArray(options) || options.filter((o: { text: string }) => o?.text?.trim()).length < 2)
      return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });

    const q = await SuitabilityQuestion.create({
      question: question.trim(),
      options: options
        .filter((o: { text: string }) => o?.text?.trim())
        .map((o: { text: string; value: number }) => ({ text: o.text.trim(), value: o.value ?? 0 })),
      context: context?.trim() ?? "",
      order: order ?? 0,
      published: published ?? true,
    });

    return NextResponse.json(q, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
