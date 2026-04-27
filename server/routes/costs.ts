import { Router } from "express";
import { db } from "../db";
import { costs } from "../schema";
import { and, eq, inArray, ilike, desc, sql, type SQL } from "drizzle-orm";
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
import { costBodySchema, costBatchSchema, listFilterSchema } from "../lib/schemas";
import { z } from "zod";
import { logDataEvent } from "../lib/audit";

export const costsRouter = Router();

costsRouter.use(requireAuth);
costsRouter.use(requirePermission(PERM.COSTS_READ));

const NUMERIC_FIELDS = ["cost", "price", "volume"] as const;
const NUMERIC_FIELDS_SNAKE = ["cost", "price", "volume"] as const;
const MAX_PAGE_SIZE = 5000;

function normalizeCostBody(input: unknown): Record<string, unknown> {
  const b = toCamel(input as Record<string, unknown>);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    if ((NUMERIC_FIELDS as readonly string[]).includes(k)) {
      out[k] = String(v);
    } else if (k === "year" || k === "month") {
      out[k] = Number(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * GET /api/costs?year=&months=1,2&cost_type=&company_id=&q=&page=&page_size=
 */
costsRouter.get("/", validateQuery(listFilterSchema), async (req, res) => {
  const q = req.valid!.query as {
    year?: number;
    months: number[];
    q?: string;
    cost_type?: string;
    company_id?: string;
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
  if (q.year !== undefined) conditions.push(eq(costs.year, q.year));
  if (q.months.length > 0) conditions.push(inArray(costs.month, q.months));
  if (q.cost_type) conditions.push(eq(costs.costType, q.cost_type));
  if (q.company_id) conditions.push(eq(costs.companyId, q.company_id));
  if (q.q) conditions.push(ilike(costs.description, `%${q.q}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(costs)
    .where(whereClause);

  let query = db
    .select()
    .from(costs)
    .where(whereClause)
    .orderBy(desc(costs.year), desc(costs.month), desc(costs.createdAt));

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
});

costsRouter.post(
  "/batch",
  requirePermission(PERM.COSTS_WRITE),
  validateBody(costBatchSchema),
  async (req: AuthedRequest, res) => {
    const list = req.valid!.body as unknown as unknown[];
    const result = {
      success: 0,
      failed: 0,
      errors: [] as { index: number; error: string }[],
    };
    if (list.length === 0) return res.json(result);

    const chunkSize = 100;
    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const values = chunk.map((raw) =>
        normalizeCostBody(raw as Record<string, unknown>),
      );
      try {
        const inserted = await db
          .insert(costs)
          .values(values as any)
          .returning();
        result.success += inserted.length;
        for (const row of inserted) {
          logDataEvent({
            req,
            resource: "costs",
            resourceId: (row as any).id,
            action: "create",
            metadata: { source: "batch" },
          }).catch(() => {});
        }
      } catch (err) {
        result.failed += chunk.length;
        const msg = err instanceof Error ? err.message : "Unknown error";
        chunk.forEach((_, idx) => {
          result.errors.push({ index: i + idx, error: msg });
        });
      }
    }
    res.json(result);
  },
);

costsRouter.post(
  "/",
  requirePermission(PERM.COSTS_WRITE),
  validateBody(costBodySchema),
  async (req: AuthedRequest, res) => {
    const values = normalizeCostBody(req.valid!.body);
    const [row] = await db.insert(costs).values(values as any).returning();
    logDataEvent({
      req,
      resource: "costs",
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

costsRouter.put(
  "/:id",
  requirePermission(PERM.COSTS_WRITE),
  validateParams(paramsWithId),
  validateBody(costBodySchema.partial()),
  async (req: AuthedRequest, res) => {
    const patch = normalizeCostBody(req.valid!.body);
    patch.updatedAt = new Date();
    const [row] = await db
      .update(costs)
      .set(patch as any)
      .where(eq(costs.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "costs",
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

costsRouter.post(
  "/bulk-delete",
  requirePermission(PERM.COSTS_WRITE),
  validateBody(bulkDeleteSchema),
  async (req: AuthedRequest, res) => {
    const { year, months } = req.valid!.body as { year: number; months: number[] };
    const deleted = await db
      .delete(costs)
      .where(and(eq(costs.year, year), inArray(costs.month, months)))
      .returning({ id: costs.id });
    logDataEvent({ req, resource: "costs", resourceId: null, action: "bulk_delete" }).catch(() => {});
    res.json({ deleted: deleted.length });
  },
);

costsRouter.delete(
  "/:id",
  requirePermission(PERM.COSTS_WRITE),
  validateParams(paramsWithId),
  async (req: AuthedRequest, res) => {
    const deleted = await db
      .delete(costs)
      .where(eq(costs.id, req.params.id))
      .returning({ id: costs.id });
    if (deleted.length === 0) return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "costs",
      resourceId: req.params.id,
      action: "delete",
    }).catch(() => {});
    res.status(204).send();
  },
);
