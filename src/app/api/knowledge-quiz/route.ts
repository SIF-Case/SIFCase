import { NextResponse} from "next/server";
import { connectDB } from "@/lib/mongodb";
import KnowledgeQuiz from "@/models/KnowledgeQuiz";

export async function GET() {
  await connectDB();
  
  const questions = await KnowledgeQuiz.find({ published: true })
    .sort({ order: 1 })
    .select("question options context points order")
    .lean();
  
  // Remove correct answer info for security - users shouldn't see this until they submit
  const sanitized = questions.map((q: any) => ({
    _id: q._id.toString(),
    question: q.question,
    options: q.options.map((opt: any) => ({
      text: opt.text,
      _id: opt._id?.toString(),
    })),
    points: q.points,
  }));
  
  return NextResponse.json(sanitized);
}
