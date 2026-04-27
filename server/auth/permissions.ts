import { eq } from "drizzle-orm";
import { db } from "../db";
import { rolePermissions } from "../schema";

export type AppRole = "Admin" | "Manager" | "User";

// -----------------------------------------------------------------------------
// Permission keys (canonical strings used everywhere in the codebase).
// Keep in sync with server/scripts/migrate-auth-redesign.ts PERMISSION_CATALOG.
// -----------------------------------------------------------------------------
export const PERM = {
  REVENUES_READ: "revenues:read",
  REVENUES_WRITE: "revenues:write",
  PLANS_READ: "plans:read",
  PLANS_WRITE: "plans:write",
  COSTS_READ: "costs:read",
  COSTS_WRITE: "costs:write",
  SALARY_COSTS_READ: "salary_costs:read",
  SALARY_COSTS_WRITE: "salary_costs:write",
  EMPLOYEES_READ: "employees:read",
  EMPLOYEES_WRITE: "employees:write",
  MASTER_DATA_READ: "master_data:read",
  MASTER_DATA_WRITE: "master_data:write",
  EXCHANGE_RATES_READ: "exchange_rates:read",
  EXCHANGE_RATES_WRITE: "exchange_rates:write",
  PARAMETERS_READ: "parameters:read",
  PARAMETERS_WRITE: "parameters:write",
  BONUS_READ: "bonus:read",
  BONUS_WRITE: "bonus:write",
  REPORTS_READ: "reports:read",
  USERS_MANAGE: "users:manage",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type PermissionKey = (typeof PERM)[keyof typeof PERM];

/**
 * Cache role → permission set with a bounded TTL so out-of-band `role_permissions`
 * mutations become visible within a minute without requiring explicit invalidation.
 */
const TTL_MS = 60_000;
const cache = new Map<AppRole, { set: Set<string>; expiresAt: number }>();

async function loadRolePermissions(role: AppRole): Promise<Set<string>> {
  const now = Date.now();
  const entry = cache.get(role);
  if (entry && entry.expiresAt > now) return entry.set;

  const rows = await db
    .select({ key: rolePermissions.permissionKey })
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role));
  const set = new Set(rows.map((r) => r.key));
  cache.set(role, { set, expiresAt: now + TTL_MS });
  return set;
}

export function invalidatePermissionsCache(role?: AppRole) {
  if (role) cache.delete(role);
  else cache.clear();
}

/** Return the full permission list for a role — used by /auth/me response. */
export async function getPermissionsForRole(
  role: AppRole | null,
): Promise<string[]> {
  if (!role) return [];
  const set = await loadRolePermissions(role);
  return Array.from(set).sort();
}

/** Check whether a role has ALL of the given permissions. */
export async function hasPermissions(
  role: AppRole | null,
  required: readonly string[],
): Promise<boolean> {
  if (!role) return false;
  if (required.length === 0) return true;
  const set = await loadRolePermissions(role);
  for (const perm of required) {
    if (!set.has(perm)) return false;
  }
  return true;
}
