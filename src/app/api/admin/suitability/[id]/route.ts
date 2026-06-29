import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SuitabilityQuestion from "@/models/SuitabilityQuestion";

// PATCH — update question
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (body.options) {
      body.options = body.options
        .filter((o: { text: string }) => o?.text?.trim())
        .map((o: { text: string; value: number }) => ({ text: o.text.trim(), value: o.value ?? 0 }));
    }

    const updated = await SuitabilityQuestion.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — remove question
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    await SuitabilityQuestion.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
