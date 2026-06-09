import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess, getEffectiveAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Client, { CLIENT_STAGES } from "@/models/Client";
import User from "@/models/User";
import { auth } from "@/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "clients", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const session = await auth();
  const loggedInUserId = session?.user?.id;
  if (!loggedInUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getEffectiveAccess(loggedInUserId);
  const isSales = !access?.isSuperAdmin && !!access?.user?.role;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const search = searchParams.get("q") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const assignedTo = searchParams.get("assignedTo") ?? "";

  const filters: Record<string, unknown>[] = [];
  if (search) {
    // Use $text if no regex special chars, else fall back to regex on indexed fields only
    filters.push({ $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ] });
  }
  if (stage && CLIENT_STAGES.includes(stage as never)) filters.push({ stage });

  if (isSales) {
    filters.push({ assignedTo: new mongoose.Types.ObjectId(loggedInUserId) });
  } else if (assignedTo) {
    filters.push({ assignedTo });
  }

  const query = filters.length ? { $and: filters } : {};

  // Projection: exclude fat subdoc arrays from list view
  const listProjection = "name email phone company stage assignedTo linkedUserId lastContactedAt createdAt tags _isRawUser";

  const [existingClients, crmTotal, canEdit] = await Promise.all([
    Client.find(query, listProjection)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Client.countDocuments(query),
    hasPageAccess(req, "clients", "edit"),
  ]);

  // Only include raw users on page 1 with no filters (they fill after CRM clients)
  const includeRawUsers = !stage && !assignedTo && !isSales && !search;
  let rawUsers: { _id: unknown; name?: string; email?: string; phone?: string; createdAt: Date }[] = [];
  let rawTotal = 0;

  if (includeRawUsers) {
    const linkedUserIds = await Client.distinct("linkedUserId", { linkedUserId: { $ne: null } });
    const userQuery = { $and: [
      { isAdmin: { $ne: true } },
      { role: null },
      ...(linkedUserIds.length ? [{ _id: { $nin: linkedUserIds } }] : []),
    ] };
    [rawUsers, rawTotal] = await Promise.all([
      User.find(userQuery, "name email phone createdAt").sort({ createdAt: -1 }).limit(200).lean(),
      User.countDocuments(userQuery),
    ]);
  }

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

  const total = crmTotal + rawTotal;
  // CRM clients are paginated at DB level; raw users fill remaining slots on last page
  const crmOnPage = existingClients.length;
  const slotsLeft = limit - crmOnPage;
  const rawOffset = Math.max(0, (page - 1) * limit - crmTotal);
  const rawSlice = includeRawUsers ? userClients.slice(rawOffset, rawOffset + slotsLeft) : [];

  const paginated = [...existingClients, ...rawSlice];

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
