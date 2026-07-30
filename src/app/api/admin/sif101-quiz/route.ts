import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import Sif101Quiz from "@/models/Sif101Quiz";
import { SIF101_QUIZZES } from "@/lib/sif101Quizzes";

// Lists every SIF 101 topic with whichever quiz currently backs it — a DB
// override if an admin has saved one, otherwise the shipped default so the
// editor always opens pre-filled instead of blank.
export async function GET(req: NextRequest) {
  if (!(await hasPageAccess(req, "sif101Quiz", "view"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const articles = await Article.find({ status: "published", category: "SIF Education" })
    .sort({ order: 1, publishedAt: -1 })
    .select("slug title order")
    .lean();

  const overrides = await Sif101Quiz.find({ topicSlug: { $in: articles.map((a: any) => a.slug) } }).lean();
  const overrideBySlug = new Map(overrides.map((o: any) => [o.topicSlug, o]));

  const topics = articles.map((a: any) => {
    const override = overrideBySlug.get(a.slug);
    return {
      slug: a.slug,
      title: a.title,
      order: a.order ?? 0,
      questions: override ? override.questions : SIF101_QUIZZES[a.slug] ?? [],
      isOverridden: !!override,
      hasDefault: !!SIF101_QUIZZES[a.slug],
    };
  });

  return NextResponse.json({ topics });
}
