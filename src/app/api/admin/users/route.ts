import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

const STAFF_FILTER = { $or: [{ isAdmin: true }, { role: { $ne: null } }] };

export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const search = searchParams.get("q") ?? "";

  const query = search
    ? { $and: [STAFF_FILTER, { $or: [{ email: { $regex: search, $options: "i" } }, { name: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }] }] }
    : STAFF_FILTER;

  const [users, total, roles] = await Promise.all([
    User.find(query, "-passwordHash").populate("role", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(query),
    Role.find({}, "name").sort({ name: 1 }).lean(),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit), roles });
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action, roleId } = body;
  if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

  await connectDB();

  if (action === "setRole") {
    if (roleId) {
      const role = await Role.findById(roleId, "_id").lean();
      if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
      await User.findByIdAndUpdate(id, { role: roleId });
    } else {
      await User.findByIdAndUpdate(id, { role: null });
    }
    return NextResponse.json({ ok: true });
  }

  const allowed = ["setAdmin", "removeAdmin", "block", "unblock"];
  if (!allowed.includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const update =
    action === "setAdmin"    ? { isAdmin: true }   :
    action === "removeAdmin" ? { isAdmin: false }  :
    action === "block"       ? { isBlocked: true } :
                               { isBlocked: false };

  await User.findByIdAndUpdate(id, update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await connectDB();
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
