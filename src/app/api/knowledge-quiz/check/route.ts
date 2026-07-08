import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import KnowledgeQuiz from "@/models/KnowledgeQuiz";

export async function POST(req: NextRequest) {
  await connectDB();
  
  const body = await req.json();
  const { answers } = body; // { questionId: optionId }
  
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  
  const questionIds = Object.keys(answers);
  const questions = await KnowledgeQuiz.find({
    _id: { $in: questionIds },
    published: true,
  }).lean();
  
  let totalScore = 0;
  let maxScore = 0;
  const results = questions.map((q: any) => {
    const userAnswerId = answers[q._id.toString()];
    const correctOption = q.options.find((opt: any) => opt.isCorrect);
    const userAnswer = q.options.find((opt: any) => opt._id.toString() === userAnswerId);
    const isCorrect = userAnswer?.isCorrect === true;
    
    maxScore += q.points;
    if (isCorrect) {
      totalScore += q.points;
    }
    
    return {
      questionId: q._id.toString(),
      question: q.question,
      userAnswerId,
      userAnswerText: userAnswer?.text || "",
      isCorrect,
      correctAnswerId: correctOption?._id.toString(),
      correctAnswerText: correctOption?.text || "",
      context: q.context || "",
      pointsEarned: isCorrect ? q.points : 0,
      pointsPossible: q.points,
    };
  });
  
  return NextResponse.json({
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    results,
  });
}
