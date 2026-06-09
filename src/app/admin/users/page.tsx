"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff, Ban, CircleCheck, Trash2, RefreshCw, KeyRound, Plus, Pencil, X } from "lucide-react";
import { ADMIN_PAGES } from "@/lib/adminPages";

type RoleOption = { _id: string; name: string };

type Permission = { pageKey: string; view: boolean; edit: boolean };
type Role = {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
};

type RoleFormState = { name: string; description: string; permissions: Record<string, { view: boolean; edit: boolean }> };

function emptyRolePermissions(): Record<string, { view: boolean; edit: boolean }> {
  const obj: Record<string, { view: boolean; edit: boolean }> = {};
  for (const page of ADMIN_PAGES) obj[page.key] = { view: false, edit: false };
  return obj;
}

function toRoleFormState(role?: Role): RoleFormState {
  const permissions = emptyRolePermissions();
  if (role) {
    for (const p of role.permissions) {
      if (permissions[p.pageKey]) permissions[p.pageKey] = { view: p.view || p.edit, edit: p.edit };
    }
  }
  return { name: role?.name ?? "", description: role?.description ?? "", permissions };
}

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  googleId?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  role?: { _id: string; name: string } | null;
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
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Role management (folded in from the standalone Roles page)
  const [rolesOpen, setRolesOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null | "new">(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(toRoleFormState());
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setRoleOptions(data.roles ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    const res = await fetch("/api/admin/roles");
    const data = await res.json();
    setRoles(data.roles ?? []);
    setRolesLoading(false);
  }, []);

  function openRoles() {
    setRolesOpen(true);
    fetchRoles();
  }

  function openCreateRole() {
    setRoleForm(toRoleFormState());
    setRoleError(null);
    setEditingRole("new");
  }

  function openEditRole(role: Role) {
    setRoleForm(toRoleFormState(role));
    setRoleError(null);
    setEditingRole(role);
  }

  function closeRoleForm() {
    setEditingRole(null);
    setRoleError(null);
  }

  function toggleRolePermission(pageKey: string, field: "view" | "edit") {
    setRoleForm(prev => {
      const current = prev.permissions[pageKey];
      const next = { ...current, [field]: !current[field] };
      if (field === "edit" && next.edit) next.view = true;
      if (field === "view" && !next.view) next.edit = false;
      return { ...prev, permissions: { ...prev.permissions, [pageKey]: next } };
    });
  }

  async function saveRole() {
    if (!roleForm.name.trim()) { setRoleError("Name is required"); return; }
    setRoleSaving(true);
    setRoleError(null);
    const permissions = ADMIN_PAGES
      .map(page => ({ pageKey: page.key, ...roleForm.permissions[page.key] }))
      .filter(p => p.view || p.edit);

    const isNew = editingRole === "new";
    const url = isNew ? "/api/admin/roles" : `/api/admin/roles/${(editingRole as Role)._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roleForm.name.trim(), description: roleForm.description, permissions }),
    });
    const data = await res.json();
    setRoleSaving(false);
    if (!res.ok) { setRoleError(data.error || "Failed to save role"); return; }
    closeRoleForm();
    fetchRoles();
    fetchUsers();
  }

  async function removeRole(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/roles/${role._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed to delete role"); return; }
    fetchRoles();
  }

  async function action(id: string, act: string) {
    setActionLoading(id + act);
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: act }) });
    await fetchUsers();
    setActionLoading(null);
  }

  async function setRole(id: string, roleId: string) {
    setActionLoading(id + "setRole");
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "setRole", roleId: roleId || null }) });
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
          <p className="text-[14px] text-muted mt-1">{total} user{total === 1 ? "" : "s"} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openRoles} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <KeyRound className="size-3.5" /> Manage roles
          </button>
          <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
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
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_100px_90px_140px_90px_120px] gap-4 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>User</div><div>Email</div><div>Phone</div><div>Joined</div><div>Admin</div><div>Role</div><div>Status</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">No users found.</div>
        ) : users.map((u) => (
          <div key={u._id} className={`grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_100px_90px_140px_90px_120px] gap-4 px-5 py-3.5 border-b border-rule last:border-0 items-center ${u.isBlocked ? "bg-red-50/40" : "hover:bg-surface"}`}>
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
              {u.isAdmin ? (
                <span className="text-[11px] text-faint italic" title="Super-admins have full access — roles don't apply">Not applicable</span>
              ) : (
                <select value={u.role?._id ?? ""} disabled={!!actionLoading}
                  onChange={(e) => setRole(u._id, e.target.value)}
                  title="Assign role"
                  className="w-full h-7 px-1.5 rounded-[6px] border border-rule bg-white text-[11px] text-body outline-none focus:border-primary disabled:opacity-40 disabled:bg-mist">
                  <option value="">No role</option>
                  {roleOptions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              )}
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

      {/* Roles management modal */}
      {rolesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={() => { setRolesOpen(false); closeRoleForm(); }}>
          <div className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white">
              <h2 className="text-[16px] font-bold text-heading">Roles</h2>
              <button onClick={() => { setRolesOpen(false); closeRoleForm(); }} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6">
              {editingRole === null ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] text-muted">{roles.length} role{roles.length === 1 ? "" : "s"}</p>
                    <button onClick={openCreateRole} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-primary text-white text-[12px] font-semibold hover:opacity-90">
                      <Plus className="size-3.5" /> New role
                    </button>
                  </div>

                  {rolesLoading ? (
                    <div className="py-12 text-center text-muted text-[13px]">Loading…</div>
                  ) : roles.length === 0 ? (
                    <div className="py-12 text-center text-muted text-[13px]">No roles yet — create one to get started.</div>
                  ) : (
                    <div className="border border-rule rounded-[10px] overflow-hidden">
                      <div className="grid grid-cols-[1.2fr_1.6fr_1fr_90px_90px] gap-3 px-4 py-2 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
                        <div>Name</div><div>Description</div><div>Pages granted</div><div>System</div><div>Actions</div>
                      </div>
                      {roles.map(r => {
                        const grantedCount = r.permissions.filter(p => p.view || p.edit).length;
                        return (
                          <div key={r._id} className="grid grid-cols-[1.2fr_1.6fr_1fr_90px_90px] gap-3 px-4 py-3 border-b border-rule last:border-0 items-center">
                            <div className="text-[13px] font-semibold text-heading truncate">{r.name}</div>
                            <div className="text-[12px] text-body truncate">{r.description || <span className="text-faint">—</span>}</div>
                            <div className="text-[12px] text-muted">{grantedCount} page{grantedCount === 1 ? "" : "s"}</div>
                            <div>
                              {r.isSystem
                                ? <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">System</span>
                                : <span className="text-faint text-[11px]">—</span>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEditRole(r)} title="Edit role"
                                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary/30">
                                <Pencil className="size-3.5" />
                              </button>
                              <button onClick={() => removeRole(r)} title={r.isSystem ? "System roles can't be deleted" : "Delete role"}
                                disabled={r.isSystem}
                                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 disabled:opacity-30">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={closeRoleForm} className="text-[12px] text-muted hover:text-body">&larr; Back to roles</button>
                  </div>
                  <h3 className="text-[14px] font-bold text-heading mb-4">{editingRole === "new" ? "New role" : `Edit "${(editingRole as Role).name}"`}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Name</label>
                      <input value={roleForm.name} onChange={(e) => setRoleForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">Description</label>
                      <input value={roleForm.description} onChange={(e) => setRoleForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary" />
                    </div>
                  </div>

                  <label className="block text-[11px] font-semibold text-muted mb-1.5">Page permissions</label>
                  <div className="border border-rule rounded-[10px] overflow-hidden mb-4">
                    <div className="grid grid-cols-[1fr_80px_80px] gap-3 px-4 py-2 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
                      <div>Page</div><div>View</div><div>Edit</div>
                    </div>
                    {ADMIN_PAGES.map(page => {
                      const perm = roleForm.permissions[page.key];
                      return (
                        <div key={page.key} className="grid grid-cols-[1fr_80px_80px] gap-3 px-4 py-2.5 border-b border-rule last:border-0 items-center">
                          <div className="text-[12px] text-body">{page.label}</div>
                          <div>
                            <input type="checkbox" checked={perm.view} onChange={() => toggleRolePermission(page.key, "view")}
                              className="size-4 accent-primary cursor-pointer" />
                          </div>
                          <div>
                            <input type="checkbox" checked={perm.edit} disabled={!page.editable}
                              onChange={() => toggleRolePermission(page.key, "edit")}
                              className="size-4 accent-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {roleError && <p className="text-[12px] text-loss mb-3">{roleError}</p>}

                  <div className="flex items-center gap-2">
                    <button onClick={saveRole} disabled={roleSaving}
                      className="px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
                      {roleSaving ? "Saving…" : "Save role"}
                    </button>
                    <button onClick={closeRoleForm} className="px-4 py-2 rounded-[8px] border border-rule text-[13px] text-muted hover:text-body">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
