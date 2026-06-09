import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess, getEffectiveAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Client, { CLIENT_STAGES, ClientStage } from "@/models/Client";
import User from "@/models/User";
import SIFScheme from "@/models/SIFScheme";
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
  let client = await Client.findById(id)
    .populate("assignedTo", "name email")
    .populate("notes.authorId", "name")
    .lean();

  if (!client) {
    client = await Client.findOne({ linkedUserId: id })
      .populate("assignedTo", "name email")
      .populate("notes.authorId", "name")
      .lean();
  }

  if (!client) {
    const user = await User.findById(id).lean();
    if (user) {
      const newClient = await Client.create({
        name: user.name || user.email || user.phone || "Unknown User",
        email: user.email || undefined,
        phone: user.phone || undefined,
        linkedUserId: user._id,
        stage: "lead",
        source: "Create User",
        activities: [{ action: "Create User", description: "Registered user account", createdAt: user.createdAt || new Date() }],
        pageVisits: [],
        notes: [{ text: "User account created", authorName: "System", createdAt: user.createdAt || new Date() }],
      });
      client = await Client.findById(newClient._id)
        .populate("assignedTo", "name email")
        .populate("notes.authorId", "name")
        .lean();
    }
  }

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  const loggedInUserId = session?.user?.id;
  if (loggedInUserId) {
    // Reuse the cached access object — no extra DB query
    const access = await getEffectiveAccess(loggedInUserId);
    const isSales = !access?.isSuperAdmin && access?.user?.role;
    if (isSales) {
      const isAssigned = client.assignedTo?._id?.toString() === loggedInUserId ||
                         client.assignedTo?.toString() === loggedInUserId;
      if (!isAssigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (client.activities?.length) {
    // Collect all scheme codes that need resolution in one pass, then batch-fetch
    const codeToResolve = new Map<string, { actionType: string; idx: number }[]>();
    for (let i = 0; i < client.activities.length; i++) {
      const act = client.activities[i];
      if (act.action === "Wishlist" && act.description) {
        const match = act.description.match(/^(Added|Removed) scheme to watchlist: (.+)$/);
        if (match && !match[2].includes("(")) {
          const code = match[2];
          if (!codeToResolve.has(code)) codeToResolve.set(code, []);
          codeToResolve.get(code)!.push({ actionType: match[1], idx: i });
        }
      }
    }
    if (codeToResolve.size > 0) {
      const schemes = await SIFScheme.find(
        { schemeCode: { $in: Array.from(codeToResolve.keys()) } },
        "schemeCode schemeName isinGrowth isinReinvestment",
      ).lean();
      const schemeMap = new Map(schemes.map(s => [s.schemeCode, s]));
      for (const [code, refs] of codeToResolve) {
        const scheme = schemeMap.get(code);
        if (scheme) {
          const isin = scheme.isinGrowth || scheme.isinReinvestment || "";
          const schemeInfo = `${scheme.schemeName}${isin ? ` (${isin})` : ""}`;
          for (const { actionType, idx } of refs) {
            client.activities[idx].description = `${actionType} scheme to watchlist: ${schemeInfo}`;
          }
        }
      }
    }
  }

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

  let client = await Client.findById(id);
  if (!client) {
    client = await Client.findOne({ linkedUserId: id });
  }
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = authorId ? await getEffectiveAccess(authorId) : null;
  const isSales = !access?.isSuperAdmin && !!access?.user?.role;
  if (isSales) {
    const isAssigned = client.assignedTo?.toString() === authorId;
    if (!isAssigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "assign" && isSales) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const session = await auth();
  const loggedInUserId = session?.user?.id;
  if (!loggedInUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getEffectiveAccess(loggedInUserId);
  const isSales = !access?.isSuperAdmin && !!access?.user?.role;

  let client = await Client.findById(id);
  if (!client) {
    client = await Client.findOne({ linkedUserId: id });
  }
  if (client && isSales) {
    const isAssigned = client.assignedTo?.toString() === loggedInUserId;
    if (!isAssigned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await Client.findByIdAndDelete(id);
  if (!deleted) {
    await Client.findOneAndDelete({ linkedUserId: id });
  }
  return NextResponse.json({ ok: true });
}
