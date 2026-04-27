import { employees } from "../schema";
import { crudRouter } from "../lib/crudRouter";
import { PERM } from "../auth/permissions";
import { employeeBodySchema, employeeBulkUpsertSchema } from "../lib/schemas";
import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { requirePermission, type AuthedRequest } from "../auth/middleware";
import { validateBody } from "../lib/validate";
import { z } from "zod";
import { logDataEvent } from "../lib/audit";
import { toCamel } from "../lib/serialize";

/**
 * Employees — `working_day` is a numeric column so convert to string on write
 * and back to number on read.
 */
export const employeesRouter = crudRouter({
  table: employees,
  idColumn: employees.id,
  orderBy: employees.username,
  readPermission: PERM.EMPLOYEES_READ,
  writePermission: PERM.EMPLOYEES_WRITE,
  bodySchema: employeeBodySchema,
  resource: "employees",
  numericFields: ["working_day"],
  mapBody: (b) => {
    const out: Record<string, unknown> = { ...b };
    if (out.workingDay !== undefined && out.workingDay !== null) {
      out.workingDay = String(out.workingDay);
    }
    if (out.year !== undefined && out.year !== null) out.year = Number(out.year);
    if (out.month !== undefined && out.month !== null) out.month = Number(out.month);
    return out;
  },
});

function normalizeEmployeeBody(input: Record<string, unknown>): Record<string, unknown> {
  const b = toCamel(input);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (k === "id") continue;
    if (k === "workingDay") {
      out.workingDay = v === null ? "0" : String(v);
    } else if (k === "year" || k === "month") {
      out[k] = v === null ? null : Number(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

employeesRouter.post(
  "/bulk-upsert",
  requirePermission(PERM.EMPLOYEES_WRITE),
  validateBody(employeeBulkUpsertSchema),
  async (req: AuthedRequest, res) => {
    const list = req.valid!.body as unknown as Array<Record<string, unknown>>;
    const result = {
      created: 0,
      updated: 0,
      errors: [] as { index: number; error: string }[],
    };
    if (list.length === 0) return res.json(result);

    const toInsert: { idx: number; values: Record<string, unknown> }[] = [];
    const toUpdate: { idx: number; id: string; values: Record<string, unknown> }[] = [];
    list.forEach((raw, idx) => {
      const values = normalizeEmployeeBody(raw);
      const id = (raw as { id?: string }).id;
      if (id) toUpdate.push({ idx, id, values });
      else toInsert.push({ idx, values });
    });

    try {
      await db.transaction(async (tx) => {
        const chunkSize = 500;
        for (let i = 0; i < toInsert.length; i += chunkSize) {
          const chunk = toInsert.slice(i, i + chunkSize);
          const inserted = await tx
            .insert(employees)
            .values(chunk.map((c) => c.values) as any)
            .returning({ id: employees.id });
          result.created += inserted.length;
        }
        for (const u of toUpdate) {
          const patch = { ...u.values, updatedAt: new Date() };
          const updated = await tx
            .update(employees)
            .set(patch as any)
            .where(eq(employees.id, u.id))
            .returning({ id: employees.id });
          if (updated.length === 0) {
            result.errors.push({ index: u.idx, error: "Row not found" });
          } else {
            result.updated += 1;
          }
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ error: msg });
    }

    if (result.created > 0) {
      logDataEvent({
        req,
        resource: "employees",
        resourceId: null,
        action: "create",
        metadata: { source: "bulk_upsert", count: result.created },
      }).catch(() => {});
    }
    if (result.updated > 0) {
      logDataEvent({
        req,
        resource: "employees",
        resourceId: null,
        action: "update",
        metadata: { source: "bulk_upsert", count: result.updated },
      }).catch(() => {});
    }
    res.json(result);
  },
);

const bulkDeleteSchema = z.object({
  year: z.number().int().min(1900).max(3000),
  months: z.array(z.number().int().min(1).max(12)).min(1),
});

employeesRouter.post(
  "/bulk-delete",
  requirePermission(PERM.EMPLOYEES_WRITE),
  validateBody(bulkDeleteSchema),
  async (req: AuthedRequest, res) => {
    const { year, months } = req.valid!.body as { year: number; months: number[] };
    const deleted = await db
      .delete(employees)
      .where(and(eq(employees.year, year), inArray(employees.month, months)))
      .returning({ id: employees.id });
    logDataEvent({ req, resource: "employees", resourceId: null, action: "bulk_delete" }).catch(() => {});
    res.json({ deleted: deleted.length });
  },
);
