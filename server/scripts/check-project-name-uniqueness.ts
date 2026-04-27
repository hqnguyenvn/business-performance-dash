/**
 * Per-project: list distinct revenue.project_name values to spot the
 * cases where users use project_name as a per-row tag (e.g. per-person).
 */
import "dotenv/config";
import { db, pool } from "../db";
import { revenues, projects } from "../schema";

async function main() {
  const allRevs = await db.select().from(revenues);
  const allProjects = await db.select().from(projects);
  const projById = new Map(allProjects.map((p) => [p.id, p]));

  const namesPerProj = new Map<string, Set<string>>();
  const countsPerProj = new Map<string, number>();
  for (const r of allRevs) {
    if (!r.projectId) continue;
    const set = namesPerProj.get(r.projectId) || new Set<string>();
    set.add((r.projectName || "").trim());
    namesPerProj.set(r.projectId, set);
    countsPerProj.set(r.projectId, (countsPerProj.get(r.projectId) || 0) + 1);
  }

  const problematic: { code: string; rows: number; distinct: string[] }[] = [];
  for (const [pid, names] of namesPerProj) {
    if (names.size > 1) {
      const proj = projById.get(pid);
      problematic.push({
        code: proj?.code ?? pid,
        rows: countsPerProj.get(pid) || 0,
        distinct: [...names].sort(),
      });
    }
  }
  problematic.sort((a, b) => b.distinct.length - a.distinct.length);

  console.log(`Projects with >1 distinct revenue.project_name: ${problematic.length}`);
  for (const p of problematic) {
    console.log(`  ${p.code.padEnd(28)} (${p.rows} rows, ${p.distinct.length} distinct names):`);
    for (const n of p.distinct) console.log(`      "${n}"`);
  }
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
