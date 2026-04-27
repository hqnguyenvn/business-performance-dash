/**
 * Phase 1 — Seed permission catalog, map roles → permissions, and
 * mark existing users as must_change_password.
 *
 * Run AFTER `npm run db:push` has applied the new schema.
 *
 *   npm run auth:seed
 *
 * This script is idempotent: safe to run multiple times.
 */
import "dotenv/config";
import { db, pool } from "../db";
import { permissions, rolePermissions, users } from "../schema";
import { sql } from "drizzle-orm";

// -----------------------------------------------------------------------------
// Permission catalog
// -----------------------------------------------------------------------------
const PERMISSION_CATALOG: Array<{ key: string; description: string }> = [
  { key: "revenues:read", description: "View revenues" },
  { key: "revenues:write", description: "Create, update, delete revenues" },
  { key: "plans:read", description: "View annual plans (BMM and revenue targets)" },
  { key: "plans:write", description: "Create, update, delete annual plans" },
  { key: "costs:read", description: "View costs" },
  { key: "costs:write", description: "Create, update, delete costs" },
  { key: "salary_costs:read", description: "View salary costs" },
  { key: "salary_costs:write", description: "Create, update, delete salary costs" },
  { key: "employees:read", description: "View employees" },
  { key: "employees:write", description: "Create, update, delete employees" },
  { key: "master_data:read", description: "View master data (companies, divisions, customers, ...)" },
  { key: "master_data:write", description: "Create, update, delete master data" },
  { key: "exchange_rates:read", description: "View exchange rates" },
  { key: "exchange_rates:write", description: "Create, update, delete exchange rates" },
  { key: "parameters:read", description: "View system parameters" },
  { key: "parameters:write", description: "Create, update, delete system parameters" },
  { key: "bonus:read", description: "View bonus data" },
  { key: "bonus:write", description: "Create, update, delete bonus data" },
  { key: "reports:read", description: "View all reports (business / customer / company / division)" },
  { key: "users:manage", description: "Manage users, roles, and passwords" },
  { key: "settings:manage", description: "Manage system settings" },
];

type AppRole = "Admin" | "Manager" | "User";

// Role → permission mapping
const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  Admin: PERMISSION_CATALOG.map((p) => p.key), // all
  Manager: [
    "revenues:read",
    "revenues:write",
    "plans:read",
    "plans:write",
    "costs:read",
    "costs:write",
    "salary_costs:read",
    "salary_costs:write",
    "employees:read",
    "master_data:read",
    "exchange_rates:read",
    "parameters:read",
    "bonus:read",
    "bonus:write",
    "reports:read",
  ],
  User: [
    "revenues:read",
    "plans:read",
    "costs:read",
    "salary_costs:read",
    "employees:read",
    "master_data:read",
    "exchange_rates:read",
    "parameters:read",
    "bonus:read",
    "reports:read",
  ],
};

async function seedPermissions() {
  console.log("[1/3] Seeding permissions catalog...");
  // Upsert: insert, on conflict do nothing (keep existing descriptions)
  for (const p of PERMISSION_CATALOG) {
    await db
      .insert(permissions)
      .values(p)
      .onConflictDoUpdate({
        target: permissions.key,
        set: { description: p.description },
      });
  }
  console.log(`  ${PERMISSION_CATALOG.length} permissions seeded.`);
}

async function seedRolePermissions() {
  console.log("[2/3] Seeding role → permission mapping...");
  // Clear existing mappings for the three managed roles, then reinsert
  // (so removing a permission from the mapping actually removes it).
  for (const role of ["Admin", "Manager", "User"] as const) {
    await db.execute(
      sql`DELETE FROM role_permissions WHERE role = ${role}::app_role`,
    );
    const keys = ROLE_PERMISSIONS[role];
    if (keys.length > 0) {
      await db.insert(rolePermissions).values(
        keys.map((k) => ({ role, permissionKey: k })),
      );
    }
    console.log(`  ${role}: ${keys.length} permissions`);
  }
}

async function markExistingUsersMustChangePassword() {
  console.log("[3/3] Marking existing users as must_change_password...");
  const result = await db.execute(
    sql`UPDATE users SET must_change_password = true WHERE must_change_password = false RETURNING id, email`,
  );
  const rows = (result as unknown as { rows?: Array<{ email: string }> }).rows ?? [];
  console.log(`  Updated ${rows.length} user(s).`);
  if (rows.length > 0) {
    for (const r of rows) {
      console.log(`    - ${r.email}`);
    }
  }
  console.log(
    "  → All flagged users must change their password on next login.",
  );
  console.log(
    '  → Current temporary password is "ChangeMe@2026" (set by the previous migration script).',
  );
}

async function main() {
  console.log("=== Auth Redesign Seed ===\n");
  await seedPermissions();
  await seedRolePermissions();
  await markExistingUsersMustChangePassword();
  console.log("\n=== Done ===");
  await pool.end();
}

main().catch((err) => {
  console.error("FATAL:", err);
  pool.end();
  process.exit(1);
});
