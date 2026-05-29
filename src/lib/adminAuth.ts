import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user || !user.isAdmin) redirect("/");

  return user;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  return !!user?.isAdmin;
}
