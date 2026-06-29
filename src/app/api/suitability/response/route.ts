import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SuitabilityResponse from "@/models/SuitabilityResponse";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const body = await req.json();
    const { sessionId, answers, completed } = body;

    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    // Upsert by sessionId — update in progress or mark complete
    const update: Record<string, unknown> = { answers };
    if (session?.user?.id) update.userId = session.user.id;
    if (completed) update.completedAt = new Date();

    const result = await SuitabilityResponse.findOneAndUpdate(
      { sessionId },
      { $set: update },
      { upsert: true, new: true },
    );

    return NextResponse.json({ ok: true, id: result._id });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
