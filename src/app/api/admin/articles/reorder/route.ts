import { NextRequest, NextResponse } from "next/server";
import { hasPageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  if (!await hasPageAccess(req, "articles", "edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();

  const body = await req.json() as { items?: { id: string; order: number }[] };
  const items = (body.items ?? []).filter(i => i.id && Number.isFinite(i.order));
  if (!items.length) return NextResponse.json({ error: "No items provided" }, { status: 400 });

  await Article.bulkWrite(
    items.map(i => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(i.id) },
        update: { $set: { order: i.order } },
      },
    })),
  );

  // Revalidate SIF-101 pages since order affects display
  revalidatePath("/sif-101");

  return NextResponse.json({ ok: true });
}
