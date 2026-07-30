import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Sif101Quiz from "@/models/Sif101Quiz";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ slug: string }> };

function validateQuestions(questions: unknown): string | null {
  if (!Array.isArray(questions) || questions.length === 0) return "At least one question is required";
  for (const [i, q] of questions.entries()) {
    if (!q || typeof q !== "object") return `Question ${i + 1} is invalid`;
    const { q: text, options, answer, explain } = q as any;
    if (!text || typeof text !== "string") return `Question ${i + 1} needs question text`;
    if (!Array.isArray(options) || options.length < 2) return `Question ${i + 1} needs at least 2 options`;
    if (options.some((o: unknown) => typeof o !== "string" || !o.trim())) return `Question ${i + 1} has an empty option`;
    if (typeof answer !== "number" || answer < 0 || answer >= options.length) return `Question ${i + 1} needs a valid correct-answer index`;
    if (typeof explain !== "string") return `Question ${i + 1} needs an explanation`;
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await hasPageAccess(req, "sif101Quiz", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const body = await req.json();
  const error = validateQuestions(body.questions);
  if (error) return NextResponse.json({ error }, { status: 400 });

  await connectDB();
  await Sif101Quiz.findOneAndUpdate(
    { topicSlug: slug },
    { topicSlug: slug, questions: body.questions },
    { upsert: true, new: true }
  );

  revalidatePath(`/sif-101/${slug}`);
  return NextResponse.json({ ok: true });
}

// Reverts a topic back to its shipped default quiz by deleting the DB override.
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await hasPageAccess(req, "sif101Quiz", "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  await connectDB();
  await Sif101Quiz.deleteOne({ topicSlug: slug });

  revalidatePath(`/sif-101/${slug}`);
  return NextResponse.json({ ok: true });
}
