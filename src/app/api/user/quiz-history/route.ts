import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/auth";
import { KnowledgeQuizResponse, SuitabilityQuizResponse } from "@/models/QuizResponse";

// Get user's quiz history
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await connectDB();
  
  const { searchParams } = new URL(req.url);
  const quizType = searchParams.get("type"); // 'knowledge' or 'suitability'
  const limit = parseInt(searchParams.get("limit") || "10");
  
  try {
    if (quizType === "knowledge") {
      const responses = await KnowledgeQuizResponse.find({
        userId: session.user.id as any,
      })
        .sort({ completedAt: -1 })
        .limit(limit)
        .lean();
      
      return NextResponse.json({
        type: "knowledge",
        responses: responses.map((r: any) => ({
          _id: r._id.toString(),
          totalScore: r.totalScore,
          maxScore: r.maxScore,
          percentage: r.percentage,
          passed: r.passed,
          completedAt: r.completedAt,
          answersCount: r.answers.length,
        })),
      });
    } else if (quizType === "suitability") {
      const responses = await SuitabilityQuizResponse.find({
        userId: session.user.id as any,
      })
        .sort({ completedAt: -1 })
        .limit(limit)
        .lean();
      
      return NextResponse.json({
        type: "suitability",
        responses: responses.map((r: any) => ({
          _id: r._id.toString(),
          totalScore: r.totalScore,
          recommendation: r.recommendation,
          completedAt: r.completedAt,
          answersCount: r.answers.length,
        })),
      });
    } else {
      // Get both types
      const [knowledgeResponses, suitabilityResponses] = await Promise.all([
        KnowledgeQuizResponse.find({ userId: session.user.id as any })
          .sort({ completedAt: -1 })
          .limit(5)
          .lean(),
        SuitabilityQuizResponse.find({ userId: session.user.id as any })
          .sort({ completedAt: -1 })
          .limit(5)
          .lean(),
      ]);
      
      return NextResponse.json({
        knowledge: {
          count: knowledgeResponses.length,
          latest: knowledgeResponses[0] ? {
            completedAt: knowledgeResponses[0].completedAt,
            percentage: (knowledgeResponses[0] as any).percentage,
            passed: (knowledgeResponses[0] as any).passed,
          } : null,
        },
        suitability: {
          count: suitabilityResponses.length,
          latest: suitabilityResponses[0] ? {
            completedAt: suitabilityResponses[0].completedAt,
            recommendation: (suitabilityResponses[0] as any).recommendation,
          } : null,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz history" },
      { status: 500 }
    );
  }
}
