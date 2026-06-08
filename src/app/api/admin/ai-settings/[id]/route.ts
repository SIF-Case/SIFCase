import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import AISetting from "@/models/AISetting";
import { isValidAiUsage } from "@/lib/aiUsages";

const PROVIDERS = new Set(["deepseek", "gemini", "openrouter"]);

function sanitizeUsages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const v of input) {
    if (typeof v === "string" && isValidAiUsage(v)) seen.add(v);
  }
  return [...seen];
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const update: Record<string, unknown> = {};
    if (typeof body.label === "string" && body.label.trim()) update.label = body.label.trim();
    if (typeof body.provider === "string" && PROVIDERS.has(body.provider)) update.provider = body.provider;
    if (typeof body.modelName === "string" && body.modelName.trim()) update.modelName = body.modelName.trim();
    if (typeof body.apiKey === "string" && body.apiKey.trim()) update.apiKey = body.apiKey.trim();

    if (body.usages !== undefined) {
      const usages = sanitizeUsages(body.usages);
      if (usages.length) {
        await AISetting.updateMany({ _id: { $ne: id }, usages: { $in: usages } }, { $pullAll: { usages } });
      }
      update.usages = usages;
    }

    const setting = await AISetting.findByIdAndUpdate(id, update, { returnDocument: "after" });
    if (!setting) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();

  try {
    const setting = await AISetting.findByIdAndDelete(id);
    if (!setting) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
