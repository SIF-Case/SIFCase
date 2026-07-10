import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Nfo from "@/models/Nfo";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  if (!await hasPageAccess(req, "nfos", "view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const nfos = await Nfo.find().sort({ closeDate: 1 }).lean();
  return NextResponse.json({ nfos });
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "nfos", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  const { name, amc, category, openDate, closeDate, allotmentDate, minInvestment, subscriptionPrice } = body;
  if (!name || !amc || !category || !openDate || !closeDate || !allotmentDate) {
    return NextResponse.json({ error: "Name, AMC, category, open/close/allotment dates required" }, { status: 400 });
  }

  let slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name);
  if (await Nfo.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;

  const nfo = await Nfo.create({
    slug,
    amc,
    amcShort: body.amcShort || "",
    avatar: body.avatar || amc.charAt(0).toUpperCase(),
    name,
    category,
    structure: body.structure || "Open-ended",
    openDate: new Date(openDate),
    closeDate: new Date(closeDate),
    allotmentDate: new Date(allotmentDate),
    reopenDate: body.reopenDate ? new Date(body.reopenDate) : null,
    minInvestment: Number(minInvestment) || 0,
    subscriptionPrice: Number(subscriptionPrice) || 0,
    exitLoad: body.exitLoad || "",
    benchmark: body.benchmark || "",
    riskLevel: body.riskLevel || "",
    riskColor: body.riskColor || "var(--danger)",
    published: body.published !== false,
    allocationBands: Array.isArray(body.allocationBands) ? body.allocationBands : [],
    strategyPoints: Array.isArray(body.strategyPoints) ? body.strategyPoints : [],
    managers: Array.isArray(body.managers) ? body.managers : [],
    docs: Array.isArray(body.docs) ? body.docs : [],
  });

  revalidatePath("/nfos");
  revalidatePath(`/nfos/${slug}`);
  return NextResponse.json({ ok: true, id: nfo._id, slug: nfo.slug });
}
