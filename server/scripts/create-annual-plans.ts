/**
 * One-off: create the `annual_plans` table.
 *
 *   npx tsx server/scripts/create-annual-plans.ts
 *
 * Idempotent — uses IF NOT EXISTS / DO blocks so it's safe to re-run.
 */
import "dotenv/config";
import { db, pool } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("[1/3] Creating annual_plans table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS annual_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      year integer NOT NULL,
      month integer NOT NULL,
      company_id uuid NOT NULL REFERENCES companies(id),
      bmm numeric NOT NULL DEFAULT '0',
      revenue numeric NOT NULL DEFAULT '0',
      currency_id uuid REFERENCES currencies(id),
      notes text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `);

  console.log("[2/3] Adding unique constraint...");
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_annual_plans_year_month_company'
      ) THEN
        ALTER TABLE annual_plans
          ADD CONSTRAINT uq_annual_plans_year_month_company
          UNIQUE (year, month, company_id);
      END IF;
    END$$
  `);

  console.log("[3/3] Adding index...");
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_annual_plans_year_month
      ON annual_plans (year, month)
  `);

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
