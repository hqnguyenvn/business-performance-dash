import { Router } from "express";
import { db } from "../db";
import { salaryCosts } from "../schema";
import { and, eq, inArray, desc, sql, type SQL } from "drizzle-orm";
import {
  toSnake,
  toSnakeArray,
  toCamel,
  coerceNumeric,
  coerceNumericArray,
} from "../lib/serialize";
import {
  requireAuth,
  requirePermission,
  type AuthedRequest,
} from "../auth/middleware";
import { PERM } from "../auth/permissions";
import {
  validateBody,
  validateQuery,
  validateParams,
  paramsWithId,
} from "../lib/validate";
import {
  salaryCostBodySchema,
  salaryCostBatchSchema,
  listFilterSchema,
} from "../lib/schemas";
import { logDataEvent } from "../lib/audit";
import { z } from "zod";

const NUMERIC_FIELDS_SNAKE = ["amount"] as const;
const MAX_PAGE_SIZE = 5000;

export const salaryCostsRouter = Router();

salaryCostsRouter.use(requireAuth);
salaryCostsRouter.use(requirePermission(PERM.SALARY_COSTS_READ));

function normalizeBody(input: unknown): Record<string, unknown> {
  const b = toCamel(input as Record<string, unknown>);
  return {
    ...(b.year !== undefined ? { year: Number(b.year) } : {}),
    ...(b.month !== undefined ? { month: Number(b.month) } : {}),
    ...(b.amount !== undefined ? { amount: String(b.amount) } : {}),
    ...(b.companyId !== undefined
      ? { companyId: b.companyId ? String(b.companyId) : null }
      : {}),
    ...(b.divisionId !== undefined
      ? { divisionId: b.divisionId ? String(b.divisionId) : null }
      : {}),
    ...(b.customerId !== undefined
      ? { customerId: b.customerId ? String(b.customerId) : null }
      : {}),
    ...(b.notes !== undefined ? { notes: b.notes == null ? null : String(b.notes) } : {}),
  };
}

salaryCostsRouter.get(
  "/",
  validateQuery(listFilterSchema),
  async (req, res) => {
    const q = req.valid!.query as {
      year?: number;
      months: number[];
      page: number;
      page_size?: number | "all";
    };
    const pageSize =
      q.page_size === "all"
        ? MAX_PAGE_SIZE
        : typeof q.page_size === "number"
          ? Math.min(q.page_size, MAX_PAGE_SIZE)
          : undefined;

    const conditions: SQL[] = [];
    if (q.year !== undefined) conditions.push(eq(salaryCosts.year, q.year));
    if (q.months.length > 0)
      conditions.push(inArray(salaryCosts.month, q.months));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(salaryCosts)
      .where(whereClause);

    let query = db
      .select()
      .from(salaryCosts)
      .where(whereClause)
      .orderBy(desc(salaryCosts.year), desc(salaryCosts.month));

    if (pageSize !== undefined) {
      const offset = (q.page - 1) * pageSize;
      query = (query as any).limit(pageSize).offset(offset);
    } else {
      query = (query as any).limit(MAX_PAGE_SIZE);
    }

    const rows = await query;
    res.json({
      data: coerceNumericArray(
        toSnakeArray(rows as Record<string, unknown>[]),
        NUMERIC_FIELDS_SNAKE,
      ),
      total: Number(count),
    });
  },
);

salaryCostsRouter.post(
  "/batch",
  requirePermission(PERM.SALARY_COSTS_WRITE),
  validateBody(salaryCostBatchSchema),
  async (req: AuthedRequest, res) => {
    const list = req.valid!.body as unknown as unknown[];
    if (list.length === 0) return res.json([]);
    const values = list.map((raw) => normalizeBody(raw));
    const chunkSize = 100;
    const out: Record<string, unknown>[] = [];
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      const rows = await db.insert(salaryCosts).values(chunk as any).returning();
      out.push(...(rows as Record<string, unknown>[]));
    }
    for (const row of out) {
      logDataEvent({
        req,
        resource: "salary_costs",
        resourceId: String((row as any).id),
        action: "create",
        metadata: { source: "batch" },
      }).catch(() => {});
    }
    res.json(coerceNumericArray(toSnakeArray(out), NUMERIC_FIELDS_SNAKE));
  },
);

salaryCostsRouter.post(
  "/",
  requirePermission(PERM.SALARY_COSTS_WRITE),
  validateBody(salaryCostBodySchema),
  async (req: AuthedRequest, res) => {
    const values = normalizeBody(req.valid!.body);
    const [row] = await db.insert(salaryCosts).values(values as any).returning();
    logDataEvent({
      req,
      resource: "salary_costs",
      resourceId: (row as any).id,
      action: "create",
    }).catch(() => {});
    res.json(
      coerceNumeric(
        toSnake(row as Record<string, unknown>),
        NUMERIC_FIELDS_SNAKE,
      ),
    );
  },
);

salaryCostsRouter.put(
  "/:id",
  requirePermission(PERM.SALARY_COSTS_WRITE),
  validateParams(paramsWithId),
  validateBody(salaryCostBodySchema.partial()),
  async (req: AuthedRequest, res) => {
    const patch = normalizeBody(req.valid!.body);
    patch.updatedAt = new Date();
    const [row] = await db
      .update(salaryCosts)
      .set(patch as any)
      .where(eq(salaryCosts.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "salary_costs",
      resourceId: req.params.id,
      action: "update",
    }).catch(() => {});
    res.json(
      coerceNumeric(
        toSnake(row as Record<string, unknown>),
        NUMERIC_FIELDS_SNAKE,
      ),
    );
  },
);

const bulkDeleteSchema = z.object({
  year: z.number().int().min(1900).max(3000),
  months: z.array(z.number().int().min(1).max(12)).min(1),
});

salaryCostsRouter.post(
  "/bulk-delete",
  requirePermission(PERM.SALARY_COSTS_WRITE),
  validateBody(bulkDeleteSchema),
  async (req: AuthedRequest, res) => {
    const { year, months } = req.valid!.body as { year: number; months: number[] };
    const deleted = await db
      .delete(salaryCosts)
      .where(and(eq(salaryCosts.year, year), inArray(salaryCosts.month, months)))
      .returning({ id: salaryCosts.id });
    logDataEvent({ req, resource: "salary_costs", resourceId: null, action: "bulk_delete" }).catch(() => {});
    res.json({ deleted: deleted.length });
  },
);

salaryCostsRouter.delete(
  "/:id",
  requirePermission(PERM.SALARY_COSTS_WRITE),
  validateParams(paramsWithId),
  async (req: AuthedRequest, res) => {
    const deleted = await db
      .delete(salaryCosts)
      .where(eq(salaryCosts.id, req.params.id))
      .returning({ id: salaryCosts.id });
    if (deleted.length === 0)
      return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "salary_costs",
      resourceId: req.params.id,
      action: "delete",
    }).catch(() => {});
    res.status(204).send();
  },
);
