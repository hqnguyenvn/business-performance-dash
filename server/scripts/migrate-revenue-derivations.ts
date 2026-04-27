/**
 * Migrate revenue rows so that 3 derivable fields match their canonical
 * source (Option C-strict from the audit):
 *
 *   step 1: backfill `projects.name` (where empty) from the most-frequent
 *           `revenue.project_name` linked to that project — preserves the
 *           descriptive names users typed at the row level.
 *   step 2: revenues.customer_id    := projects.customer_id   (sync)
 *   step 3: revenues.project_name   := projects.name          (sync)
 *   step 4: revenues.original_amount := unit_price * quantity (sync)
 *
 * The script is safe to re-run: each step skips rows already in sync.
 *
 *   npx tsx server/scripts/migrate-revenue-derivations.ts          # dry-run
 *   npx tsx server/scripts/migrate-revenue-derivations.ts --apply  # actually write
 */
import "dotenv/config";
import { db, pool } from "../db";
import { revenues, projects } from "../schema";
import { eq } from "drizzle-orm";

async function main() {
  const apply = process.argv.includes("--apply");
  const log = (...args: unknown[]) => console.log(...args);

  log(`=== Revenue derivation migration ${apply ? "(APPLY)" : "(dry-run)"} ===\n`);

  const allRevs = await db.select().from(revenues);
  const allProjects = await db.select().from(projects);
  const projById = new Map(allProjects.map((p) => [p.id, p]));

  // -----------------------------------------------------------------------
  // STEP 1 — backfill projects.name from revenue.project_name
  // -----------------------------------------------------------------------
  log("[1/4] Backfilling projects.name where empty …");
  const projectsToBackfill: { id: string; code: string; pickedName: string; sources: number }[] = [];
  for (const proj of allProjects) {
    if (proj.name && proj.name.trim() !== "") continue;
    // gather candidate names from revenue rows linked to this project
    const counts = new Map<string, number>();
    for (const r of allRevs) {
      if (r.projectId !== proj.id) continue;
      const name = (r.projectName || "").trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    if (counts.size === 0) continue;
    // pick most frequent (tie-break by lexicographic — deterministic)
    let pickedName = "";
    let pickedCount = -1;
    for (const [name, c] of counts) {
      if (c > pickedCount || (c === pickedCount && name < pickedName)) {
        pickedName = name;
        pickedCount = c;
      }
    }
    projectsToBackfill.push({
      id: proj.id,
      code: proj.code,
      pickedName,
      sources: pickedCount,
    });
  }
  log(`  Projects with empty name: ${projectsToBackfill.length}`);
  if (projectsToBackfill.length > 0) {
    log(`  Examples (first 8):`);
    for (const p of projectsToBackfill.slice(0, 8)) {
      log(`    ${p.code.padEnd(28)} → "${p.pickedName}"  (${p.sources} revenue row(s) agree)`);
    }
  }

  // Always reflect the backfill in our in-memory map so steps 2-3 compute
  // accurately in BOTH dry-run and apply modes.
  for (const p of projectsToBackfill) {
    const inMem = projById.get(p.id);
    if (inMem) inMem.name = p.pickedName;
  }
  if (apply && projectsToBackfill.length > 0) {
    for (const p of projectsToBackfill) {
      await db.update(projects).set({ name: p.pickedName }).where(eq(projects.id, p.id));
    }
    log(`  ✔ Updated ${projectsToBackfill.length} projects.`);
  }

  // -----------------------------------------------------------------------
  // STEP 2 — sync revenues.customer_id := projects.customer_id
  // -----------------------------------------------------------------------
  log("\n[2/4] Syncing revenues.customer_id ← projects.customer_id …");
  const customerUpdates: { id: string; from: string | null; to: string | null }[] = [];
  for (const r of allRevs) {
    if (!r.projectId) continue;
    const proj = projById.get(r.projectId);
    if (!proj || !proj.customerId) continue;
    if (r.customerId !== proj.customerId) {
      customerUpdates.push({ id: r.id, from: r.customerId, to: proj.customerId });
    }
  }
  log(`  Rows to update: ${customerUpdates.length}`);
  if (customerUpdates.length) {
    const sample = customerUpdates.slice(0, 5);
    sample.forEach((u) =>
      log(`    rev=${u.id.slice(0, 8)} : ${u.from?.slice(0, 8) ?? "∅"} → ${u.to?.slice(0, 8)}`),
    );
  }
  if (apply) {
    for (const u of customerUpdates) {
      await db.update(revenues).set({ customerId: u.to }).where(eq(revenues.id, u.id));
    }
    if (customerUpdates.length) log(`  ✔ Updated ${customerUpdates.length} rows.`);
  }

  // -----------------------------------------------------------------------
  // STEP 3 — sync revenues.project_name := projects.name
  // -----------------------------------------------------------------------
  log("\n[3/4] Syncing revenues.project_name ← projects.name …");
  const nameUpdates: { id: string; from: string; to: string }[] = [];
  for (const r of allRevs) {
    if (!r.projectId) continue;
    const proj = projById.get(r.projectId);
    if (!proj) continue;
    const newName = proj.name || "";
    const oldName = r.projectName || "";
    if (oldName !== newName) {
      nameUpdates.push({ id: r.id, from: oldName, to: newName });
    }
  }
  log(`  Rows to update: ${nameUpdates.length}`);
  if (nameUpdates.length) {
    const sample = nameUpdates.slice(0, 5);
    sample.forEach((u) =>
      log(`    rev=${u.id.slice(0, 8)} : "${u.from}" → "${u.to}"`),
    );
  }
  if (apply) {
    for (const u of nameUpdates) {
      await db.update(revenues).set({ projectName: u.to }).where(eq(revenues.id, u.id));
    }
    if (nameUpdates.length) log(`  ✔ Updated ${nameUpdates.length} rows.`);
  }

  // -----------------------------------------------------------------------
  // STEP 4 — sync revenues.original_amount := unit_price * quantity
  // -----------------------------------------------------------------------
  log("\n[4/4] Syncing revenues.original_amount ← unit_price × quantity …");
  const amountUpdates: { id: string; from: number; to: number }[] = [];
  let totalDelta = 0;
  for (const r of allRevs) {
    const up = r.unitPrice == null ? null : Number(r.unitPrice);
    const qty = r.quantity == null ? null : Number(r.quantity);
    if (up == null || qty == null) continue; // can't derive — leave as-is
    const stored = r.originalAmount == null ? 0 : Number(r.originalAmount);
    const computed = up * qty;
    if (Math.abs(stored - computed) > 0.005) {
      amountUpdates.push({ id: r.id, from: stored, to: computed });
      totalDelta += computed - stored;
    }
  }
  log(`  Rows to update: ${amountUpdates.length}`);
  log(`  Net total delta on SUM(original_amount): ${totalDelta.toFixed(2)} VND`);
  if (amountUpdates.length) {
    const sample = amountUpdates.slice(0, 5);
    sample.forEach((u) =>
      log(`    rev=${u.id.slice(0, 8)} : ${u.from} → ${u.to} (Δ ${(u.to - u.from).toFixed(2)})`),
    );
  }
  if (apply) {
    for (const u of amountUpdates) {
      await db
        .update(revenues)
        .set({ originalAmount: String(u.to) })
        .where(eq(revenues.id, u.id));
    }
    if (amountUpdates.length) log(`  ✔ Updated ${amountUpdates.length} rows.`);
  }

  log(`\n=== Done ${apply ? "(applied)" : "(dry-run)"} ===`);
  if (!apply) log(`Re-run with --apply to write changes.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
