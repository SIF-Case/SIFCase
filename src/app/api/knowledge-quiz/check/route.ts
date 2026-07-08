import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/auth";
import mongoose from "mongoose";
import KnowledgeQuiz from "@/models/KnowledgeQuiz";
import { KnowledgeQuizResponse } from "@/models/QuizResponse";

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required", requiresAuth: true },
      { status: 401 }
    );
  }

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
  const answerDetails: Array<{
    questionId: any;
    selectedOptionId: string;
    isCorrect: boolean;
    pointsEarned: number;
  }> = [];
  
  const results = questions.map((q: any) => {
    const userAnswerId = answers[q._id.toString()];
    const correctOption = q.options.find((opt: any) => opt.isCorrect);
    const userAnswer = q.options.find((opt: any) => opt._id.toString() === userAnswerId);
    const isCorrect = userAnswer?.isCorrect === true;
    
    maxScore += q.points;
    const pointsEarned = isCorrect ? q.points : 0;
    if (isCorrect) {
      totalScore += pointsEarned;
    }
    
    // Store for database
    answerDetails.push({
      questionId: q._id,
      selectedOptionId: userAnswerId,
      isCorrect,
      pointsEarned,
    });
    
    return {
      questionId: q._id.toString(),
      question: q.question,
      userAnswerId,
      userAnswerText: userAnswer?.text || "",
      isCorrect,
      correctAnswerId: correctOption?._id.toString(),
      correctAnswerText: correctOption?.text || "",
      context: q.context || "",
      pointsEarned,
      pointsPossible: q.points,
    };
  });
  
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = percentage >= 70;
  
  // Save quiz response to database
  try {
    await KnowledgeQuizResponse.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      quizType: "knowledge",
      answers: answerDetails,
      totalScore,
      maxScore,
      percentage,
      passed,
      completedAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save quiz response:", error);
    // Continue even if save fails
  }
  
  return NextResponse.json({
    totalScore,
    maxScore,
    percentage,
    results,
  });
}
