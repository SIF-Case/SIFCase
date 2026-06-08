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

function maskKey(key: string): string {
  if (key.length <= 4) return "••••";
  return `••••${key.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const settings = await AISetting.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    settings: settings.map(s => ({
      _id: s._id,
      label: s.label,
      provider: s.provider,
      modelName: s.modelName,
      apiKeyMasked: maskKey(s.apiKey),
      usages: s.usages,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json();
    const { label, provider, modelName, apiKey } = body;

    if (!label || !String(label).trim()) return NextResponse.json({ error: "Label required" }, { status: 400 });
    if (!PROVIDERS.has(provider)) return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    if (!modelName || !String(modelName).trim()) return NextResponse.json({ error: "Model required" }, { status: 400 });
    if (!apiKey || !String(apiKey).trim()) return NextResponse.json({ error: "API key required" }, { status: 400 });

    const usages = sanitizeUsages(body.usages);

    // Each usage can be claimed by only one config at a time — checking it
    // here unclaims it from whichever config previously held it.
    if (usages.length) {
      await AISetting.updateMany({ usages: { $in: usages } }, { $pullAll: { usages } });
    }

    const setting = await AISetting.create({
      label: String(label).trim(),
      provider,
      modelName: String(modelName).trim(),
      apiKey: String(apiKey).trim(),
      usages,
    });

    return NextResponse.json({ ok: true, id: setting._id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
