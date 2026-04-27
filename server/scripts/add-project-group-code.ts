/**
 * One-off: add `group_code` column to `projects` table.
 *   npx tsx server/scripts/add-project-group-code.ts
 */
import "dotenv/config";
import { db, pool } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS group_code varchar`,
  );
  console.log("OK — projects.group_code is now present (nullable).");
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
