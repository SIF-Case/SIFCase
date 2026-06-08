import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import { ADMIN_PAGES } from "@/lib/adminPages";
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

// ── Page-level permissions ────────────────────────────────────────────────
// Layered on top of isAdmin: admins always get full access (unchanged
// behavior). Non-admin staff get a `role` reference whose page/permission
// matrix determines what they can see and edit. Users with neither are
// plain external customers ("clients").

export type PageAction = "view" | "edit";

export interface PagePermission {
  view: boolean;
  edit: boolean;
}

export interface EffectiveAccess {
  user: Awaited<ReturnType<typeof User.findById>>;
  isSuperAdmin: boolean;
  permissions: Map<string, PagePermission>;
}

function permissionAllows(perm: PagePermission | undefined, action: PageAction): boolean {
  if (!perm) return false;
  return action === "edit" ? perm.edit : perm.view || perm.edit;
}

export async function getEffectiveAccess(userId: string): Promise<EffectiveAccess | null> {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user || user.isBlocked) return null;

  if (user.isAdmin) {
    const permissions = new Map<string, PagePermission>();
    for (const page of ADMIN_PAGES) {
      permissions.set(page.key, { view: true, edit: page.editable });
    }
    return { user, isSuperAdmin: true, permissions };
  }

  const permissions = new Map<string, PagePermission>();
  if (user.role) {
    const role = await Role.findById(user.role).lean();
    if (role) {
      for (const p of role.permissions) {
        permissions.set(p.pageKey, { view: p.view, edit: p.edit });
      }
    }
  }

  return { user, isSuperAdmin: false, permissions };
}

export function isInternalStaff(user: { isAdmin?: boolean; role?: unknown } | null | undefined): boolean {
  return !!user && (!!user.isAdmin || !!user.role);
}

export async function requirePageAccess(pageKey: string, action: PageAction = "view") {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const access = await getEffectiveAccess(session.user.id);
  if (!access) redirect("/");

  if (access.isSuperAdmin) return access.user;

  const perm = access.permissions.get(pageKey);
  if (!permissionAllows(perm, action)) redirect("/admin");

  return access.user;
}

// Same gate as requirePageAccess("view"), but also reports whether the user
// can edit this page — handy for server-component pages that need to pass a
// `canEdit` flag down into a client component to show/hide mutating controls.
export async function requirePageAccessDetailed(pageKey: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const access = await getEffectiveAccess(session.user.id);
  if (!access) redirect("/");

  if (access.isSuperAdmin) return { user: access.user, canView: true, canEdit: true };

  const perm = access.permissions.get(pageKey);
  const canView = permissionAllows(perm, "view");
  const canEdit = permissionAllows(perm, "edit");
  if (!canView) redirect("/admin");

  return { user: access.user, canView, canEdit };
}

export async function hasPageAccess(req: Request, pageKey: string, action: PageAction = "view"): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const access = await getEffectiveAccess(session.user.id);
  if (!access) return false;

  if (access.isSuperAdmin) return true;

  return permissionAllows(access.permissions.get(pageKey), action);
}

// True if the requester has the given action on ANY of the listed pages.
// Useful when several admin pages share one underlying API (e.g. "funds" and "schemes").
export async function hasAnyPageAccess(req: Request, pageKeys: string[], action: PageAction = "view"): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const access = await getEffectiveAccess(session.user.id);
  if (!access) return false;

  if (access.isSuperAdmin) return true;

  return pageKeys.some(key => permissionAllows(access.permissions.get(key), action));
}
