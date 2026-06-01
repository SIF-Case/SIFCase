"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff, Ban, CircleCheck, Trash2, RefreshCw } from "lucide-react";

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  googleId?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
};

function badge(user: User) {
  const methods = [];
  if (user.email) methods.push("Email");
  if (user.phone) methods.push("Phone");
  if (user.googleId) methods.push("Google");
  return methods.join(" · ") || "Unknown";
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function action(id: string, act: string) {
    setActionLoading(id + act);
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: act }) });
    await fetchUsers();
    setActionLoading(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    setActionLoading(id + "delete");
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await fetchUsers();
    setActionLoading(null);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Users</h1>
          <p className="text-[14px] text-muted mt-1">{total} total users</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-rule rounded-[10px] px-3 h-10 mb-4 max-w-sm shadow-card">
        <Search className="size-3.5 text-muted shrink-0" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email, phone…"
          className="flex-1 text-[13px] bg-transparent outline-none" />
      </div>

      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_110px_100px_100px_120px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>User</div><div>Email</div><div>Phone</div><div>Joined</div><div>Admin</div><div>Status</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">No users found.</div>
        ) : users.map((u) => (
          <div key={u._id} className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_110px_100px_100px_120px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center ${u.isBlocked ? "bg-red-50/40" : "hover:bg-surface"}`}>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-heading truncate">{u.name ?? "—"}</p>
              <p className="text-[10px] font-mono text-faint mt-0.5">{badge(u)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-body truncate">{u.email ?? <span className="text-faint">—</span>}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-body font-mono truncate">{u.phone ?? <span className="text-faint">—</span>}</p>
            </div>
            <div className="text-[12px] text-muted">{new Date(u.createdAt).toLocaleDateString("en-IN")}</div>
            <div>
              {u.isAdmin
                ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Shield className="size-3" />Admin</span>
                : <span className="text-[11px] text-muted">User</span>}
            </div>
            <div>
              {u.isBlocked
                ? <span className="text-[11px] font-semibold text-loss bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Blocked</span>
                : <span className="text-[11px] text-gain">Active</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => action(u._id, u.isAdmin ? "removeAdmin" : "setAdmin")}
                title={u.isAdmin ? "Remove admin" : "Make admin"}
                disabled={!!actionLoading}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-amber-600 hover:border-amber-300 transition-colors disabled:opacity-40">
                {u.isAdmin ? <ShieldOff className="size-3.5" /> : <Shield className="size-3.5" />}
              </button>
              <button onClick={() => action(u._id, u.isBlocked ? "unblock" : "block")}
                title={u.isBlocked ? "Unblock" : "Block"}
                disabled={!!actionLoading}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 transition-colors disabled:opacity-40">
                {u.isBlocked ? <CircleCheck className="size-3.5" /> : <Ban className="size-3.5" />}
              </button>
              <button onClick={() => deleteUser(u._id)}
                title="Delete user"
                disabled={!!actionLoading}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 transition-colors disabled:opacity-40">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-rule flex items-center justify-between">
            <span className="text-[12px] text-muted">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-[8px] border border-rule text-[12px] text-muted hover:text-body disabled:opacity-40">Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 rounded-[8px] border border-rule text-[12px] text-muted hover:text-body disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
