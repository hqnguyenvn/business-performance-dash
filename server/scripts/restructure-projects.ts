/**
 * Restructure project master + revenues to the new "granular project + group_code" model.
 *
 * Before:
 *   projects.code      = portfolio (e.g. "GUI", "ESPD")
 *   revenues.project_id → portfolio
 *   revenues.project_name = granular tag (e.g. "GUI_KhoaND")
 *
 * After:
 *   projects.code       = granular code (e.g. "GUI_KhoaND")
 *   projects.group_code = portfolio (e.g. "GUI")
 *   revenues.project_id → granular project
 *   revenues.project_name = (legacy column, will be dropped later)
 *
 * Steps:
 *   1. set group_code = code on every existing master row (so portfolio stays
 *      visible as a group). NOTE: this preserves existing master entries —
 *      revenues whose project_name is empty (or matches code already) keep
 *      their current FK.
 *   2. for every distinct (revenues.project_id, revenues.project_name) pair
 *      where project_name is non-empty AND ≠ master.code: ensure a granular
 *      master row exists with code = project_name, group_code = old code,
 *      customer_id = old master's customer_id.
 *   3. repoint revenues.project_id to the granular master entry whose
 *      code = revenues.project_name. Skip rows where project_name is empty
 *      or already equals master.code.
 *
 *   npx tsx server/scripts/restructure-projects.ts          # dry-run
 *   npx tsx server/scripts/restructure-projects.ts --apply  # write
 */
import "dotenv/config";
import { db, pool } from "../db";
import { revenues, projects } from "../schema";
import { and, eq, isNull } from "drizzle-orm";

async function main() {
  const apply = process.argv.includes("--apply");
  const log = (...a: unknown[]) => console.log(...a);
  log(`=== Restructure projects ${apply ? "(APPLY)" : "(dry-run)"} ===\n`);

  const allRevs = await db.select().from(revenues);
  let allProjects = await db.select().from(projects);
  const projById = new Map(allProjects.map((p) => [p.id, p]));

  // -----------------------------------------------------------------
  // Step 1 — backfill group_code on every existing master row
  // -----------------------------------------------------------------
  log("[1/3] Backfilling group_code on existing master rows …");
  const groupBackfill = allProjects.filter(
    (p) => !p.groupCode || p.groupCode.trim() === "",
  );
  log(`  Master rows missing group_code: ${groupBackfill.length} / ${allProjects.length}`);
  if (apply && groupBackfill.length > 0) {
    for (const p of groupBackfill) {
      await db
        .update(projects)
        .set({ groupCode: p.code })
        .where(eq(projects.id, p.id));
    }
    log(`  ✔ Set group_code := code on ${groupBackfill.length} rows.`);
  }
  // reflect in-memory
  for (const p of groupBackfill) {
    const inMem = projById.get(p.id);
    if (inMem) inMem.groupCode = p.code;
  }

  // -----------------------------------------------------------------
  // Step 2 — create granular master entries for each distinct
  //          (project_id, project_name) where project_name is non-empty
  //          AND project_name ≠ master.code AND not yet present in master
  //          as a code.
  // -----------------------------------------------------------------
  log("\n[2/3] Creating granular master entries …");
  const masterCodeSet = new Set(allProjects.map((p) => p.code));
  type Granular = {
    code: string;
    customerId: string | null;
    groupCode: string;
    sourceCount: number;
  };
  const granularByCode = new Map<string, Granular>();
  for (const r of allRevs) {
    const projectName = (r.projectName || "").trim();
    if (!projectName) continue;
    if (!r.projectId) continue;
    const proj = projById.get(r.projectId);
    if (!proj) continue;
    if (projectName === proj.code) continue; // already a master entry
    const existing = granularByCode.get(projectName);
    if (existing) {
      existing.sourceCount++;
      continue;
    }
    granularByCode.set(projectName, {
      code: projectName,
      customerId: proj.customerId ?? null,
      groupCode: proj.code,
      sourceCount: 1,
    });
  }
  // Filter out any code that already exists as a master row (defensive — covers
  // any legacy collision).
  const toCreate: Granular[] = [];
  for (const g of granularByCode.values()) {
    if (masterCodeSet.has(g.code)) continue;
    toCreate.push(g);
  }
  log(`  Granular entries to create: ${toCreate.length}`);
  if (toCreate.length) {
    log(`  First 8 examples:`);
    for (const g of toCreate.slice(0, 8)) {
      log(
        `    code="${g.code}", group_code="${g.groupCode}", customer_id=${(g.customerId ?? "∅").slice(0, 8)}, ${g.sourceCount} revenue row(s)`,
      );
    }
  }
  if (apply && toCreate.length) {
    // Insert in chunks
    const chunk = 200;
    for (let i = 0; i < toCreate.length; i += chunk) {
      const slice = toCreate.slice(i, i + chunk);
      await db.insert(projects).values(
        slice.map((g) => ({
          code: g.code,
          name: g.code, // user can edit later for fuller name
          customerId: g.customerId,
          groupCode: g.groupCode,
        })),
      );
    }
    log(`  ✔ Inserted ${toCreate.length} granular master rows.`);
  }

  // Refresh master list so step 3 sees the new entries
  if (apply) {
    allProjects = await db.select().from(projects);
  } else {
    // simulate insertion in-memory for accurate dry-run of step 3
    for (const g of toCreate) {
      allProjects.push({
        id: `dryrun-${g.code}`,
        code: g.code,
        name: g.code,
        customerId: g.customerId,
        groupCode: g.groupCode,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }
  }
  const newProjByCode = new Map(allProjects.map((p) => [p.code, p]));

  // -----------------------------------------------------------------
  // Step 3 — repoint revenues.project_id when project_name maps to a
  //          granular master row.
  // -----------------------------------------------------------------
  log("\n[3/3] Repointing revenues.project_id …");
  const repoints: { revId: string; from: string | null; to: string }[] = [];
  for (const r of allRevs) {
    const projectName = (r.projectName || "").trim();
    if (!projectName) continue;
    const granular = newProjByCode.get(projectName);
    if (!granular) continue; // shouldn't happen after step 2
    if (granular.id === r.projectId) continue;
    repoints.push({ revId: r.id, from: r.projectId, to: granular.id });
  }
  log(`  Revenues to repoint: ${repoints.length} / ${allRevs.length}`);
  if (repoints.length) {
    log(`  First 5 examples:`);
    repoints.slice(0, 5).forEach((u) =>
      log(
        `    rev=${u.revId.slice(0, 8)} : ${(u.from ?? "∅").slice(0, 8)} → ${u.to.slice(0, 8)}`,
      ),
    );
  }
  if (apply && repoints.length) {
    for (const u of repoints) {
      await db
        .update(revenues)
        .set({ projectId: u.to })
        .where(eq(revenues.id, u.revId));
    }
    log(`  ✔ Repointed ${repoints.length} revenues.`);
  }

  log(`\n=== Done ${apply ? "(applied)" : "(dry-run)"} ===`);
  if (!apply) log("Re-run with --apply to write changes.");
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
