import Role, { IRolePagePermission } from "@/models/Role";
import { ADMIN_PAGES } from "@/lib/adminPages";

interface DefaultRole {
  name: string;
  description: string;
  isSystem: boolean;
  permissions: IRolePagePermission[];
}

function perms(grants: Record<string, "view" | "edit">): IRolePagePermission[] {
  return Object.entries(grants).map(([pageKey, level]) => ({
    pageKey,
    view: true,
    edit: level === "edit",
  }));
}

const DEFAULT_ROLES: DefaultRole[] = [
  {
    name: "Admin",
    description: "Full unrestricted access to every admin section (mirrors the isAdmin flag).",
    isSystem: true,
    permissions: ADMIN_PAGES.map(p => ({ pageKey: p.key, view: true, edit: p.editable })),
  },
  {
    name: "Research",
    description: "Fund research & content team — manages fund data and articles, no client access.",
    isSystem: true,
    permissions: perms({
      dashboard: "view",
      funds: "view",
      schemes: "view",
      fundDetails: "edit",
      articles: "edit",
    }),
  },
  {
    name: "Sales",
    description: "Client relationship & CRM team — manages clients, views funds.",
    isSystem: true,
    permissions: perms({
      dashboard: "view",
      funds: "view",
      schemes: "view",
      clients: "edit",
    }),
  },
];

export async function seedDefaultRoles(): Promise<{ created: string[]; existing: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];
  for (const def of DEFAULT_ROLES) {
    const result = await Role.updateOne(
      { name: def.name },
      { $setOnInsert: def },
      { upsert: true },
    );
    if (result.upsertedCount > 0) created.push(def.name);
    else existing.push(def.name);
  }
  return { created, existing };
}
