import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Client, { CLIENT_STAGES } from "@/models/Client";
import User from "@/models/User";
import { auth } from "@/auth";
import mongoose from "mongoose";

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

  const [existingClients, canEdit] = await Promise.all([
    Client.find(query)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean(),
    hasPageAccess(req, "clients", "edit"),
  ]);

  // Find non-staff users not already linked to a Client record
  const linkedUserIds = existingClients
    .map((c) => c.linkedUserId)
    .filter(Boolean) as mongoose.Types.ObjectId[];

  const userFilters: Record<string, unknown>[] = [
    { isAdmin: { $ne: true } },
    { role: null },
    ...(linkedUserIds.length ? [{ _id: { $nin: linkedUserIds } }] : []),
  ];
  if (search) {
    userFilters.push({ $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ] });
  }
  // Stage/assignedTo filters only apply to CRM clients, not raw users
  const includeRawUsers = !stage && !assignedTo;

  const rawUsers = includeRawUsers
    ? await User.find({ $and: userFilters }, "name email phone createdAt").sort({ createdAt: -1 }).lean()
    : [];

  // Map raw users to client shape (no CRM fields yet)
  const userClients = rawUsers.map((u) => ({
    _id: u._id,
    name: u.name ?? u.email ?? u.phone ?? "Unknown",
    email: u.email,
    phone: u.phone,
    company: "",
    stage: "lead" as const,
    source: "app",
    assignedTo: null,
    linkedUserId: u._id,
    lastContactedAt: null,
    tags: [],
    createdAt: u.createdAt,
    _isRawUser: true,
  }));

  // Merge: CRM clients first, then unlinked users
  const merged = [...existingClients, ...userClients];
  const total = merged.length;
  const paginated = merged.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ clients: paginated, total, page, pages: Math.ceil(total / limit), canEdit });
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
