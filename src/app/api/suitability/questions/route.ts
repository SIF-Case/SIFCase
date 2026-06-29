import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SuitabilityQuestion from "@/models/SuitabilityQuestion";

export async function GET() {
  try {
    await connectDB();
    const questions = await SuitabilityQuestion.find({ published: true })
      .sort({ dimensionOrder: 1, order: 1 })
      .lean();
    return NextResponse.json(questions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
