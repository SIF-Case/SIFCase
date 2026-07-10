import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Nfo from "@/models/Nfo";
import { revalidatePath } from "next/cache";

const STRING_FIELDS = ["amc", "amcShort", "avatar", "name", "category", "structure", "exitLoad", "benchmark", "riskLevel", "riskColor"];
const DATE_FIELDS = ["openDate", "closeDate", "allotmentDate", "reopenDate"];
const NUMBER_FIELDS = ["minInvestment", "subscriptionPrice"];
const ARRAY_FIELDS = ["allocationBands", "strategyPoints", "managers", "docs"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasPageAccess(req, "nfos", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  for (const k of STRING_FIELDS) if (typeof body[k] === "string") update[k] = body[k];
  for (const k of DATE_FIELDS) {
    if (k in body) update[k] = body[k] ? new Date(body[k]) : null;
  }
  for (const k of NUMBER_FIELDS) if (body[k] != null && body[k] !== "") update[k] = Number(body[k]);
  for (const k of ARRAY_FIELDS) if (Array.isArray(body[k])) update[k] = body[k];
  if (typeof body.published === "boolean") update.published = body.published;
  if (typeof body.slug === "string" && body.slug.trim()) update.slug = body.slug.trim();

  const nfo = await Nfo.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" }).lean();
  if (!nfo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath("/nfos");
  revalidatePath(`/nfos/${nfo.slug}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasPageAccess(req, "nfos", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const nfo = await Nfo.findByIdAndDelete(id).lean();
  revalidatePath("/nfos");
  if (nfo) revalidatePath(`/nfos/${nfo.slug}`);
  return NextResponse.json({ ok: true });
}
