/**
 * Dedup revenue rows for a given (year, month).
 *
 * Two rows are considered duplicates iff every "data" field matches:
 *   year, month, project_name,
 *   customer_id, company_id, division_id, project_id, project_type_id,
 *   resource_id, currency_id,
 *   original_amount, vnd_revenue, quantity, unit_price, notes
 *
 * For each duplicate group, the row with the EARLIEST created_at is kept
 * and all later rows are deleted.
 *
 * Usage:
 *   npx tsx server/scripts/dedup-revenues.ts 2025 10           # dry-run (default)
 *   npx tsx server/scripts/dedup-revenues.ts 2025 10 --apply   # actually delete
 */
import "dotenv/config";
import { db, pool } from "../db";
import { revenues } from "../schema";
import { and, eq, inArray } from "drizzle-orm";

/**
 * `vndRevenue` is intentionally excluded — it's a snapshot derived from
 * exchange_rates at write time, so two otherwise-identical imports can
 * produce slightly different stored values yet still be true duplicates.
 */
const FIELDS_TO_COMPARE = [
  "projectName",
  "customerId",
  "companyId",
  "divisionId",
  "projectId",
  "projectTypeId",
  "resourceId",
  "currencyId",
  "originalAmount",
  "quantity",
  "unitPrice",
  "notes",
] as const;

function fingerprint(row: Record<string, unknown>): string {
  return FIELDS_TO_COMPARE
    .map((f) => {
      const v = row[f];
      if (v === null || v === undefined) return "∅";
      // numeric columns return as string from PG — keep as-is so "100" != "100.0"
      // is unlikely (drizzle normalises) but at least same string-form compares equal.
      return String(v);
    })
    .join("|");
}

async function main() {
  const args = process.argv.slice(2);
  const year = Number(args[0]);
  const month = Number(args[1]);
  const apply = args.includes("--apply");

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    console.error("Usage: dedup-revenues.ts <year> <month> [--apply]");
    process.exit(1);
  }

  console.log(
    `Scanning revenues for ${year}/${month}${apply ? " (APPLY mode — will DELETE)" : " (dry-run)"}...`,
  );

  const rows = await db
    .select()
    .from(revenues)
    .where(and(eq(revenues.year, year), eq(revenues.month, month)));
  console.log(`Found ${rows.length} rows in ${year}/${month}.`);

  // Sort by createdAt asc so the earliest survives. NULL timestamps go last.
  const sorted = [...rows].sort((a, b) => {
    const ca = a.createdAt ? a.createdAt.getTime() : Number.MAX_SAFE_INTEGER;
    const cb = b.createdAt ? b.createdAt.getTime() : Number.MAX_SAFE_INTEGER;
    return ca - cb;
  });

  const groups = new Map<string, typeof sorted>();
  for (const row of sorted) {
    const fp = fingerprint(row as Record<string, unknown>);
    const list = groups.get(fp) || [];
    list.push(row);
    groups.set(fp, list);
  }

  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
  const toDelete: typeof sorted = [];
  for (const g of duplicateGroups) {
    // keep first (earliest), delete rest
    toDelete.push(...g.slice(1));
  }

  console.log(`\nDuplicate groups: ${duplicateGroups.length}`);
  console.log(`Rows to delete:   ${toDelete.length}\n`);

  if (duplicateGroups.length > 0) {
    console.log("Sample duplicate groups (showing keep + delete-candidates):");
    for (const g of duplicateGroups.slice(0, 5)) {
      console.log(
        `  group of ${g.length} → keep id=${g[0].id} (${g[0].createdAt?.toISOString()})`,
      );
      for (const r of g.slice(1)) {
        console.log(`     drop id=${r.id} (${r.createdAt?.toISOString()})`);
      }
      console.log(
        `     payload: original=${g[0].originalAmount} qty=${g[0].quantity} project_name="${g[0].projectName}"`,
      );
    }
    if (duplicateGroups.length > 5) {
      console.log(`  ... and ${duplicateGroups.length - 5} more groups`);
    }
  }

  if (!apply) {
    console.log("\nDry-run: no rows deleted. Re-run with --apply to delete.");
    await pool.end();
    return;
  }

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    await pool.end();
    return;
  }

  const idsToDelete = toDelete.map((r) => r.id);
  // chunk to avoid overly large IN list
  const chunkSize = 500;
  let deleted = 0;
  for (let i = 0; i < idsToDelete.length; i += chunkSize) {
    const chunk = idsToDelete.slice(i, i + chunkSize);
    const res = await db
      .delete(revenues)
      .where(inArray(revenues.id, chunk))
      .returning({ id: revenues.id });
    deleted += res.length;
  }
  console.log(`Deleted ${deleted} duplicate rows.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
