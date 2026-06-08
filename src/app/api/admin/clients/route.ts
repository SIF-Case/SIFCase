import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Client, { CLIENT_STAGES } from "@/models/Client";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "clients", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const search = searchParams.get("q") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const assignedTo = searchParams.get("assignedTo") ?? "";

  const filters: Record<string, unknown>[] = [];
  if (search) {
    filters.push({ $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ] });
  }
  if (stage && CLIENT_STAGES.includes(stage as never)) filters.push({ stage });
  if (assignedTo) filters.push({ assignedTo });

  const query = filters.length ? { $and: filters } : {};

  const [clients, total, canEdit] = await Promise.all([
    Client.find(query)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Client.countDocuments(query),
    hasPageAccess(req, "clients", "edit"),
  ]);

  return NextResponse.json({ clients, total, page, pages: Math.ceil(total / limit), canEdit });
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "clients", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { name, email, phone, company, stage, source, assignedTo, investmentInterest, estimatedAumLakhs, riskProfile, tags } = body;
  if (!name || !String(name).trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const session = await auth();
  const client = await Client.create({
    name: String(name).trim(),
    email: email || undefined,
    phone: phone || undefined,
    company: company || "",
    stage: CLIENT_STAGES.includes(stage) ? stage : "lead",
    source: source || "",
    assignedTo: assignedTo || undefined,
    investmentInterest: Array.isArray(investmentInterest) ? investmentInterest : [],
    estimatedAumLakhs: estimatedAumLakhs != null && estimatedAumLakhs !== "" ? Number(estimatedAumLakhs) : null,
    riskProfile: riskProfile || null,
    tags: Array.isArray(tags) ? tags : [],
    notes: [{ text: "Client record created", authorId: session?.user?.id, authorName: session?.user?.name || "System", createdAt: new Date() }],
  });
  return NextResponse.json({ ok: true, id: client._id });
}
