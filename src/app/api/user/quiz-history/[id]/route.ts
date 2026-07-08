import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/auth";
import { KnowledgeQuizResponse, SuitabilityQuizResponse } from "@/models/QuizResponse";

// Get specific quiz response details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await connectDB();
  
  const { id } = await params;
  
  try {
    // Try to find in knowledge quiz responses first
    const knowledgeResponse = await KnowledgeQuizResponse.findOne({
      _id: id,
      userId: session.user.id as any,
    })
      .populate("answers.questionId", "question options context points")
      .lean();
    
    if (knowledgeResponse) {
      return NextResponse.json({
        type: "knowledge",
        response: knowledgeResponse,
      });
    }
    
    // Try suitability quiz responses
    const suitabilityResponse = await SuitabilityQuizResponse.findOne({
      _id: id,
      userId: session.user.id as any,
    })
      .populate("answers.questionId", "question options context")
      .lean();
    
    if (suitabilityResponse) {
      return NextResponse.json({
        type: "suitability",
        response: suitabilityResponse,
      });
    }
    
    return NextResponse.json(
      { error: "Quiz response not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching quiz response:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz response" },
      { status: 500 }
    );
  }
}
