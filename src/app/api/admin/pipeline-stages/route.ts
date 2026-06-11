import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import PipelineStages, { DEFAULT_PIPELINE_STAGES } from "@/models/PipelineStages";

async function getOrCreate() {
  let doc = await PipelineStages.findOne({});
  if (!doc) {
    doc = new PipelineStages({});
    await doc.save();
  }

  let changed = false;
  const stages = doc.stages ? [...doc.stages] : [];
  for (const defaultStage of DEFAULT_PIPELINE_STAGES) {
    if (!stages.some(s => s.key === defaultStage.key)) {
      if (defaultStage.key === "call_req") {
        const leadIdx = stages.findIndex(s => s.key === "lead");
        if (leadIdx !== -1) {
          stages.splice(leadIdx + 1, 0, defaultStage);
        } else {
          stages.unshift(defaultStage);
        }
      } else {
        stages.push(defaultStage);
      }
      changed = true;
    }
  }

  if (changed) {
    await PipelineStages.updateOne({}, { $set: { stages } });
    const updated = await PipelineStages.findOne({}).lean();
    return updated!;
  }

  return doc.toObject();
}

function slugify(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "clients", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const doc = await getOrCreate();
  return NextResponse.json({ stages: doc.stages?.length ? doc.stages : DEFAULT_PIPELINE_STAGES });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "clients", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { action, key, label, order } = await req.json() as {
    action: "add" | "rename" | "reorder" | "delete";
    key?: string;
    label?: string;
    order?: string[];
  };

  const doc = await getOrCreate();
  const stages = [...doc.stages];

  if (action === "add") {
    const trimmed = (label ?? "").trim();
    if (!trimmed) return NextResponse.json({ error: "Label required" }, { status: 400 });
    let newKey = slugify(trimmed);
    if (!newKey) return NextResponse.json({ error: "Invalid label" }, { status: 400 });
    let suffix = 1;
    while (stages.some(s => s.key === newKey)) {
      newKey = `${slugify(trimmed)}_${++suffix}`;
    }
    stages.push({ key: newKey, label: trimmed });
    await PipelineStages.updateOne({}, { $set: { stages } }, { upsert: true });
  }

  if (action === "rename" && key) {
    const trimmed = (label ?? "").trim();
    if (!trimmed) return NextResponse.json({ error: "Label required" }, { status: 400 });
    const idx = stages.findIndex(s => s.key === key);
    if (idx === -1) return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    stages[idx] = { ...stages[idx], label: trimmed };
    await PipelineStages.updateOne({}, { $set: { stages } }, { upsert: true });
  }

  if (action === "reorder" && Array.isArray(order)) {
    const byKey = new Map(stages.map(s => [s.key, s]));
    const reordered = order.map(k => byKey.get(k)).filter((s): s is { key: string; label: string } => !!s);
    await PipelineStages.updateOne({}, { $set: { stages: reordered } }, { upsert: true });
  }

  if (action === "delete" && key) {
    if (stages.length <= 1) return NextResponse.json({ error: "At least one stage is required" }, { status: 400 });
    const filtered = stages.filter(s => s.key !== key);
    await PipelineStages.updateOne({}, { $set: { stages: filtered } }, { upsert: true });
  }

  const updated = await getOrCreate();
  return NextResponse.json({ stages: updated.stages?.length ? updated.stages : DEFAULT_PIPELINE_STAGES });
}
