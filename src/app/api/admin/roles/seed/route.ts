import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import { seedDefaultRoles } from "@/lib/seedRoles";

export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const result = await seedDefaultRoles();
  return NextResponse.json({ ok: true, ...result });
}
