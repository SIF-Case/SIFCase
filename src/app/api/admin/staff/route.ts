import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEffectiveAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// Lightweight staff directory (id, name, email) for "assign to" pickers.
// Any authenticated internal staff member can read this — it's low-sensitivity
// and needed by roles (e.g. Sales) that don't have access to the full Users page.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const access = await getEffectiveAccess(session.user.id);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const isStaff = access.isSuperAdmin || access.permissions.size > 0;
  if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const staff = await User.find({ $or: [{ isAdmin: true }, { role: { $ne: null } }] }, "name email")
    .sort({ name: 1 })
    .lean();
  return NextResponse.json({ staff });
}
