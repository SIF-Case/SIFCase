"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bookmark, GitCompare, Clock, User, Trash2, Plus, Check, ArrowUpRight, Save, Loader2, BookmarkX } from "lucide-react";
import type { FundRow } from "@/lib/sifData";
import { Sparkline } from "@/components/ui/Sparkline";
import { fundHref } from "@/lib/slugify";

type Tab = "watchlist" | "compares" | "recent" | "profile";

type SavedCompare = { _id: string; name: string; schemeCodes: string[]; period: string; createdAt: string };
type RecentItem = { schemeCode: string; schemeName: string; viewedAt: string };

function shortName(name: string) {
  return name.replace(/\s*-\s*(Regular|Direct)\s*Plan.*/i, "").replace(/\s*-\s*Growth\s*Option.*/i, "").replace(/\s*(SIF|Fund)\s*$/i, "").trim();
}

function ReturnBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted text-[12px]">—</span>;
  return <span className={`text-[13px] font-semibold nums ${value >= 0 ? "text-gain" : "text-loss"}`}>{value >= 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

function WatchlistTab({ funds }: { funds: FundRow[] }) {
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/watchlist").then((r) => r.json()).then((d) => { setCodes(d.schemeCodes ?? []); setLoading(false); });
  }, []);

  async function remove(code: string) {
    setCodes((prev) => prev.filter((c) => c !== code));
    await fetch("/api/user/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schemeCode: code }) });
  }

  const watched = funds.filter((f) => codes.includes(f.schemeCode));

  if (loading) return <div className="py-16 text-center text-muted">Loading watchlist…</div>;

  if (watched.length === 0) return (
    <div className="py-16 text-center flex flex-col items-center gap-3">
      <BookmarkX className="size-10 text-faint" />
      <p className="text-[15px] font-semibold text-heading">Your watchlist is empty</p>
      <p className="text-[13px] text-muted">Click the bookmark icon on any fund to add it here.</p>
      <Link href="/sifs" className="mt-2 px-4 py-2 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover">Browse SIFs</Link>
    </div>
  );

  return (
    <div className="divide-y divide-rule">
      {watched.map((f) => {
        const si = f.returns["SI"];
        const spark = f.sparklines["SI"];
        return (
          <div key={f.schemeCode} className="flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors">
            <div className="flex-1 min-w-0">
              <Link href={fundHref(f.fundName, f.schemeCode)} className="text-[14px] font-semibold text-heading hover:text-primary truncate block">{shortName(f.name)}</Link>
              <p className="text-[11px] text-muted mt-0.5">{f.amc} · <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{f.strategy.replace(" Long-Short", "")}</span></p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-bold text-heading nums">₹{f.nav.toFixed(4)}</p>
              <p className="text-[10px] text-muted">{f.navDate}</p>
            </div>
            <div className="text-right shrink-0 w-20"><ReturnBadge value={si} /><p className="text-[9px] text-faint mt-0.5">SI Return</p></div>
            {spark.length > 1 && <div className="w-20 h-8 shrink-0"><Sparkline data={spark} stroke={si !== null && si >= 0 ? "var(--color-gain)" : "var(--color-loss)"} /></div>}
            <div className="flex items-center gap-2 shrink-0">
              <Link href={fundHref(f.fundName, f.schemeCode)} className="size-8 inline-flex items-center justify-center rounded-full border border-rule text-muted hover:text-body transition"><ArrowUpRight className="size-3.5" /></Link>
              <button onClick={() => remove(f.schemeCode)} className="size-8 inline-flex items-center justify-center rounded-full border border-rule text-muted hover:text-loss hover:border-red-300 transition"><Trash2 className="size-3.5" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparesTab({ funds }: { funds: FundRow[] }) {
  const [compares, setCompares] = useState<SavedCompare[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/compares").then((r) => r.json()).then((d) => { setCompares(d.compares ?? []); setLoading(false); });
  }, []);

  async function remove(id: string) {
    setCompares((prev) => prev.filter((c) => c._id !== id));
    await fetch("/api/user/compares", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  if (loading) return <div className="py-16 text-center text-muted">Loading comparisons…</div>;

  if (compares.length === 0) return (
    <div className="py-16 text-center flex flex-col items-center gap-3">
      <GitCompare className="size-10 text-faint" />
      <p className="text-[15px] font-semibold text-heading">No saved comparisons</p>
      <p className="text-[13px] text-muted">Use the Compare page and save your setups here.</p>
      <Link href="/compare" className="mt-2 px-4 py-2 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover">Go to Compare</Link>
    </div>
  );

  return (
    <div className="divide-y divide-rule">
      {compares.map((c) => {
        const fundNames = c.schemeCodes.map((code) => funds.find((f) => f.schemeCode === code)).filter(Boolean) as FundRow[];
        const compareUrl = `/compare?funds=${c.schemeCodes.map((s) => s.toLowerCase()).join(",")}&period=${c.period}`;
        return (
          <div key={c._id} className="px-5 py-4 hover:bg-surface transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-heading">{c.name}</p>
                <p className="text-[11px] text-muted mt-0.5">Period: <span className="font-mono text-primary">{c.period}</span> · {c.schemeCodes.length} funds · {new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {fundNames.map((f) => (
                    <span key={f.schemeCode} className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-rule text-muted">{shortName(f.name)}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={compareUrl} className="px-3 py-1.5 rounded-full bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover flex items-center gap-1.5"><ArrowUpRight className="size-3" />Open</Link>
                <button onClick={() => remove(c._id)} className="size-8 inline-flex items-center justify-center rounded-full border border-rule text-muted hover:text-loss hover:border-red-300 transition"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentTab() {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/recent").then((r) => r.json()).then((d) => { setRecent(d.recent ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>;

  if (recent.length === 0) return (
    <div className="py-16 text-center flex flex-col items-center gap-3">
      <Clock className="size-10 text-faint" />
      <p className="text-[15px] font-semibold text-heading">No recent activity</p>
      <p className="text-[13px] text-muted">Funds you view will appear here.</p>
    </div>
  );

  return (
    <div className="divide-y divide-rule">
      {recent.map((r) => (
        <Link key={r.schemeCode} href={fundHref(r.schemeName, r.schemeCode)}
          className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface transition-colors group">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-heading group-hover:text-primary truncate">{shortName(r.schemeName)}</p>
            <p className="text-[11px] text-muted font-mono">{r.schemeCode}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-[11px] text-faint">{new Date(r.viewedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
            <ArrowUpRight className="size-4 text-muted group-hover:text-primary" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProfileTab({ user }: { user: { name?: string | null; email?: string | null; image?: string | null; phone?: string | null } }) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="px-5 py-6 max-w-md space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="size-16 rounded-full" />
        ) : (
          <div className="size-16 rounded-full bg-primary flex items-center justify-center text-white text-[22px] font-bold">
            {(user.name ?? user.email ?? user.phone ?? "U")[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-[16px] font-bold text-heading">{user.name ?? "No name set"}</p>
          <p className="text-[12px] text-muted">{user.email ?? user.phone ?? "—"}</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[12px] font-medium text-muted mb-1.5">Display Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 rounded-[10px] border border-rule bg-white text-[13.5px] text-heading focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
      </div>

      {/* Linked accounts */}
      <div>
        <p className="text-[12px] font-medium text-muted mb-2">Linked Accounts</p>
        <div className="space-y-2">
          {[
            { label: "Phone", value: user.phone, icon: "📱" },
            { label: "Email", value: user.email, icon: "✉️" },
            { label: "Google", value: user.image ? "Connected" : null, icon: "🔵" },
          ].map((a) => (
            <div key={a.label} className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] border ${a.value ? "border-rule bg-surface" : "border-dashed border-rule"}`}>
              <div className="flex items-center gap-2.5">
                <span>{a.icon}</span>
                <span className="text-[13px] font-medium text-body">{a.label}</span>
              </div>
              {a.value
                ? <span className="text-[12px] text-gain flex items-center gap-1"><Check className="size-3" />{a.value === "Connected" ? "Connected" : a.value}</span>
                : <span className="text-[12px] text-muted flex items-center gap-1"><Plus className="size-3" />Not linked</span>}
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:bg-primary-hover disabled:opacity-60 shadow-btn">
        {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : <Save className="size-4" />}
        {saved ? "Saved!" : "Save changes"}
      </button>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Bookmark }[] = [
  { id: "watchlist", label: "Watchlist", icon: Bookmark },
  { id: "compares", label: "Saved Comparisons", icon: GitCompare },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "profile", label: "Profile", icon: User },
];

type Props = {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null; phone?: string | null };
  funds: FundRow[];
};

export function DashboardClient({ user, funds }: Props) {
  const [tab, setTab] = useState<Tab>("watchlist");

  return (
    <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1">My SIFcase</p>
        <h1 className="text-[30px] font-bold text-heading tracking-[-0.3px]">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-[14px] text-muted mt-1">Your watchlists, saved comparisons, and activity.</p>
      </div>

      <div className="bg-white rounded-[18px] border border-rule shadow-card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-rule overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted hover:text-body"
              }`}>
              <Icon className="size-4" />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab === "watchlist" && <WatchlistTab funds={funds} />}
          {tab === "compares" && <ComparesTab funds={funds} />}
          {tab === "recent" && <RecentTab />}
          {tab === "profile" && <ProfileTab user={user} />}
        </div>
      </div>
    </div>
  );
}
