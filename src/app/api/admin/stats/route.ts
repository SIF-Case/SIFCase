import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CronLog from "@/models/CronLog";
import mongoose from "mongoose";

export async function GET(req: Request) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const db = mongoose.connection.db!;

  const [totalUsers, totalAdmins, blockedUsers, totalSchemes, totalNavs, lastLog] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isAdmin: true }),
    User.countDocuments({ isBlocked: true }),
    db.collection("sifschemes").countDocuments(),
    db.collection("sifnavs").countDocuments(),
    CronLog.findOne().sort({ createdAt: -1 }).lean(),
  ]);

  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsers = await User.countDocuments({ createdAt: { $gte: last7Days } });

  return NextResponse.json({
    totalUsers, totalAdmins, blockedUsers, newUsers,
    totalSchemes, totalNavs,
    lastCron: lastLog ?? null,
  });
}
