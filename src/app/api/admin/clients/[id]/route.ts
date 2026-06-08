import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Client, { CLIENT_STAGES, ClientStage } from "@/models/Client";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

const STAGE_LABELS: Record<ClientStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  onboarded: "Onboarded",
  lost: "Lost",
};

export async function GET(req: NextRequest, { params }: Params) {
  if (!await hasPageAccess(req, "clients", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const client = await Client.findById(id)
    .populate("assignedTo", "name email")
    .populate("notes.authorId", "name")
    .lean();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await hasPageAccess(req, "clients", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const { action } = body;

  const session = await auth();
  const authorId = session?.user?.id;
  const authorName = session?.user?.name || "Staff";

  const client = await Client.findById(id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "addNote") {
    const text = String(body.text || "").trim();
    if (!text) return NextResponse.json({ error: "Note text required" }, { status: 400 });
    client.notes.push({ text, authorId, authorName, createdAt: new Date() } as never);
    client.lastContactedAt = new Date();
    await client.save();
    return NextResponse.json({ ok: true });
  }

  if (action === "setStage") {
    const stage = body.stage as ClientStage;
    if (!CLIENT_STAGES.includes(stage)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    if (stage !== client.stage) {
      client.notes.push({
        text: `Stage changed: ${STAGE_LABELS[client.stage]} → ${STAGE_LABELS[stage]}`,
        authorId, authorName, createdAt: new Date(),
      } as never);
      client.stage = stage;
      await client.save();
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "assign") {
    client.assignedTo = body.assignedTo || undefined;
    await client.save();
    return NextResponse.json({ ok: true });
  }

  // Plain field update (contact info edits etc.)
  const allowedFields = ["name", "email", "phone", "company", "source", "investmentInterest", "estimatedAumLakhs", "riskProfile", "tags"];
  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) update[field] = body[field];
  }
  if (Object.keys(update).length > 0) {
    await Client.findByIdAndUpdate(id, { $set: update });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await hasPageAccess(req, "clients", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  await Client.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
