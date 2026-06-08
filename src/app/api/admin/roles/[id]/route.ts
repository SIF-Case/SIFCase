import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import Role from "@/models/Role";
import User from "@/models/User";
import { ADMIN_PAGES } from "@/lib/adminPages";

const PAGE_KEYS = new Set(ADMIN_PAGES.map(p => p.key));

function sanitizePermissions(input: unknown): { pageKey: string; view: boolean; edit: boolean }[] {
  if (!Array.isArray(input)) return [];
  const result: { pageKey: string; view: boolean; edit: boolean }[] = [];
  for (const entry of input) {
    if (!entry || typeof entry.pageKey !== "string" || !PAGE_KEYS.has(entry.pageKey)) continue;
    const edit = !!entry.edit;
    result.push({ pageKey: entry.pageKey, view: !!entry.view || edit, edit });
  }
  return result;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const role = await Role.findById(id).lean();
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ role });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.description === "string") update.description = body.description;
  if (body.permissions !== undefined) update.permissions = sanitizePermissions(body.permissions);

  try {
    const role = await Role.findByIdAndUpdate(id, update, { returnDocument: "after" });
    if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await connectDB();

  const role = await Role.findById(id).lean();
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role.isSystem) return NextResponse.json({ error: "This role is protected and cannot be deleted" }, { status: 400 });

  const assignedCount = await User.countDocuments({ role: id });
  if (assignedCount > 0) {
    return NextResponse.json({ error: `${assignedCount} user${assignedCount === 1 ? "" : "s"} still assigned to this role — reassign them first` }, { status: 400 });
  }

  await Role.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
