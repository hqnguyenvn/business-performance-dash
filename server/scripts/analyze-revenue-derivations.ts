/**
 * Read-only audit: how many existing revenue rows would change if we
 * derived `customer_id`, `project_name`, and `original_amount` strictly
 * from their canonical sources.
 *
 *   customer_id     ← projects.customer_id
 *   project_name    ← projects.name
 *   original_amount ← unit_price * quantity
 *
 * Reports drift counts, top examples, and the total revenue delta this
 * migration would imply (so the user can compare with current dashboard).
 *
 * Usage:
 *   npx tsx server/scripts/analyze-revenue-derivations.ts
 */
import "dotenv/config";
import { db, pool } from "../db";
import { revenues, projects } from "../schema";
import { eq } from "drizzle-orm";

async function main() {
  const allRevs = await db.select().from(revenues);
  const allProjects = await db.select().from(projects);
  const projById = new Map(allProjects.map((p) => [p.id, p]));

  let total = allRevs.length;
  let withProject = 0;
  let withoutProject = 0;
  let customerIdDrift = 0;
  let customerIdDrift_butActualWasNull = 0;
  let projectNameDrift = 0;
  let originalAmountDrift = 0;
  let originalAmountDrift_butSourcesNull = 0;
  let totalDeltaOriginal = 0;

  const customerExamples: any[] = [];
  const nameExamples: any[] = [];
  const amountExamples: any[] = [];

  for (const r of allRevs) {
    if (!r.projectId) {
      withoutProject++;
    } else {
      withProject++;
      const proj = projById.get(r.projectId);
      if (proj) {
        // customer_id check
        if (proj.customerId && r.customerId !== proj.customerId) {
          if (r.customerId === null || r.customerId === undefined) {
            customerIdDrift_butActualWasNull++;
          } else {
            customerIdDrift++;
            if (customerExamples.length < 5)
              customerExamples.push({
                year: r.year,
                month: r.month,
                project_code: proj.code,
                old_customer_id: r.customerId,
                new_customer_id: proj.customerId,
              });
          }
        }
        // project_name check
        if ((r.projectName || "") !== (proj.name || "")) {
          projectNameDrift++;
          if (nameExamples.length < 5)
            nameExamples.push({
              year: r.year,
              month: r.month,
              project_code: proj.code,
              old: r.projectName,
              new: proj.name,
            });
        }
      }
    }

    // original_amount check
    const up = r.unitPrice == null ? null : Number(r.unitPrice);
    const qty = r.quantity == null ? null : Number(r.quantity);
    const stored = r.originalAmount == null ? null : Number(r.originalAmount);
    if (up == null || qty == null) {
      if (stored != null && stored !== 0) {
        originalAmountDrift_butSourcesNull++;
      }
    } else {
      const computed = up * qty;
      const delta = (stored ?? 0) - computed;
      if (Math.abs(delta) > 0.005) {
        originalAmountDrift++;
        totalDeltaOriginal += delta;
        if (amountExamples.length < 5)
          amountExamples.push({
            year: r.year,
            month: r.month,
            unit_price: up,
            quantity: qty,
            stored: stored,
            computed: computed,
            delta_will_lose: delta,
          });
      }
    }
  }

  console.log("=== REVENUE DERIVATION AUDIT ===\n");
  console.log(`Total rows:                    ${total}`);
  console.log(`  With project_id:             ${withProject}`);
  console.log(`  Without project_id:          ${withoutProject} (cannot derive customer/name)`);
  console.log("");
  console.log("--- customer_id drift (project.customer_id mismatch) ---");
  console.log(`  Rows that would change:                        ${customerIdDrift}`);
  console.log(`  Rows currently NULL → will be filled:          ${customerIdDrift_butActualWasNull}`);
  if (customerExamples.length) {
    console.log("  Examples:");
    customerExamples.forEach((e) =>
      console.log(
        `    ${e.year}/${e.month} project=${e.project_code} : ${e.old_customer_id?.slice(0, 8)} → ${e.new_customer_id?.slice(0, 8)}`,
      ),
    );
  }
  console.log("");
  console.log("--- project_name drift (revenues.project_name vs projects.name) ---");
  console.log(`  Rows that would change: ${projectNameDrift}`);
  if (nameExamples.length) {
    console.log("  Examples:");
    nameExamples.forEach((e) =>
      console.log(
        `    ${e.year}/${e.month} project=${e.project_code} : "${e.old}" → "${e.new}"`,
      ),
    );
  }
  console.log("");
  console.log("--- original_amount drift (stored vs unit_price*quantity) ---");
  console.log(`  Rows that would change:                        ${originalAmountDrift}`);
  console.log(`  Rows with stored amount but NULL unit/qty:     ${originalAmountDrift_butSourcesNull} (would NOT migrate, kept as-is)`);
  console.log(`  Net total delta (stored - computed):           ${totalDeltaOriginal.toLocaleString()} VND`);
  console.log(`    (positive = current SUM(original_amount) is HIGHER than computed; report totals would DECREASE by this amount)`);
  if (amountExamples.length) {
    console.log("  Examples:");
    amountExamples.forEach((e) =>
      console.log(
        `    ${e.year}/${e.month} ${e.unit_price} × ${e.quantity} = ${e.computed} (stored ${e.stored}, delta ${e.delta_will_lose})`,
      ),
    );
  }
  console.log("");
  console.log("=== END ===");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
