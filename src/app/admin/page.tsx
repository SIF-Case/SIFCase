import { requirePageAccess } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CronLog from "@/models/CronLog";
import mongoose from "mongoose";
import Link from "next/link";
import { Users, Database, Activity, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requirePageAccess("dashboard", "view");
  await connectDB();
  const db = mongoose.connection.db!;

  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const CRITICAL_FIELDS = ["amc", "isinGrowth", "companyName", "companyName_short", "brandName"];
  const FIELD_LABELS: Record<string, string> = {
    amc: "AMC",
    isinGrowth: "ISIN Growth",
    companyName: "Company",
    companyName_short: "Co Short",
    brandName: "Brand",
  };

  const [totalUsers, newUsers, totalAdmins, totalSchemes, totalNavs, recentLogs, incompleteSchemes] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: last7Days } }),
    User.countDocuments({ isAdmin: true }),
    db.collection("sifschemes").countDocuments(),
    db.collection("sifnavs").countDocuments(),
    CronLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    db.collection("sifschemes").find({
      $or: CRITICAL_FIELDS.map(f => ({ [f]: { $in: ["", null] } })),
    }, { projection: { schemeCode: 1, schemeName: 1, amc: 1, isinGrowth: 1, companyName: 1, companyName_short: 1, brandName: 1 } })
      .sort({ schemeCode: 1 }).toArray(),
  ]);

  type FlaggedScheme = { schemeCode: string; schemeName: string; missing: string[] };
  const redFlags: FlaggedScheme[] = incompleteSchemes.map((s) => ({
    schemeCode: s.schemeCode as string,
    schemeName: s.schemeName as string,
    missing: CRITICAL_FIELDS.filter(f => !s[f]),
  }));

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

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="bg-white rounded-[14px] border border-red-200 shadow-card mb-8">
          <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-loss" />
              <h2 className="text-[15px] font-bold text-heading">Red Flags</h2>
              <span className="text-[11px] font-semibold text-loss bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{redFlags.length} scheme{redFlags.length === 1 ? "" : "s"}</span>
            </div>
            <p className="text-[12px] text-muted">Schemes with missing critical fields</p>
          </div>
          <div className="divide-y divide-rule">
            {redFlags.map((f) => (
              <Link
                key={f.schemeCode}
                href={`/admin/schemes?q=${encodeURIComponent(f.schemeCode)}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-red-50/50 transition-colors group"
              >
                <span className="text-[12px] font-mono font-semibold text-primary w-16 shrink-0">{f.schemeCode}</span>
                <span className="text-[13px] text-body flex-1 min-w-0 truncate group-hover:text-heading">{f.schemeName}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {f.missing.map(field => (
                    <span key={field} className="text-[10px] font-semibold text-loss bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[4px] font-mono uppercase tracking-wide">
                      {FIELD_LABELS[field]}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
