import { requirePageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CronLog from "@/models/CronLog";
import mongoose from "mongoose";
import { Users, Database, Activity, Clock, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requirePageAccess("dashboard", "view");
  await connectDB();
  const db = mongoose.connection.db!;

  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalUsers, newUsers, totalAdmins, totalSchemes, totalNavs, recentLogs] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: last7Days } }),
    User.countDocuments({ isAdmin: true }),
    db.collection("sifschemes").countDocuments(),
    db.collection("sifnavs").countDocuments(),
    CronLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers, sub: `+${newUsers} this week`, icon: Users, color: "text-primary" },
    { label: "Admin Users", value: totalAdmins, sub: "with full access", icon: Users, color: "text-amber-500" },
    { label: "SIF Schemes", value: totalSchemes, sub: "in database", icon: Database, color: "text-gain" },
    { label: "NAV Records", value: totalNavs.toLocaleString(), sub: "total data points", icon: Activity, color: "text-primary" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Dashboard</h1>
        <p className="text-[14px] text-muted mt-1">SIFcase platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] border border-rule p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-mono uppercase tracking-widest text-muted">{s.label}</p>
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            <p className="text-[28px] font-bold text-heading nums">{s.value}</p>
            <p className="text-[12px] text-muted mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent cron logs */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card">
        <div className="px-5 py-4 border-b border-rule flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-heading">Recent Cron Jobs</h2>
          <Clock className="size-4 text-muted" />
        </div>
        <div className="divide-y divide-rule">
          {recentLogs.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-muted">No cron logs yet.</p>
          ) : recentLogs.map((log) => (
            <div key={String(log._id)} className="px-5 py-3.5 flex items-center gap-4">
              {log.status === "success"
                ? <CheckCircle className="size-4 text-gain shrink-0" />
                : <XCircle className="size-4 text-loss shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-body truncate">{log.job}</p>
                <p className="text-[11px] text-muted truncate">{log.message}</p>
              </div>
              {log.fundsUpdated != null && (
                <span className="text-[12px] text-muted shrink-0">{log.fundsUpdated} funds</span>
              )}
              {log.duration != null && (
                <span className="text-[12px] text-muted shrink-0">{(log.duration / 1000).toFixed(1)}s</span>
              )}
              <span className="text-[11px] text-faint shrink-0">{new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
