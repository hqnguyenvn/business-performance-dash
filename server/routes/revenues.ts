import { Router } from "express";
import { db } from "../db";
import { revenues, exchangeRates, currencies } from "../schema";
import { and, eq, inArray, ilike, desc, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
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
  revenueBodySchema,
  revenueBatchSchema,
  listFilterSchema,
} from "../lib/schemas";
import { logDataEvent } from "../lib/audit";

export const revenuesRouter = Router();

revenuesRouter.use(requireAuth);
revenuesRouter.use(requirePermission(PERM.REVENUES_READ));

const NUMERIC_FIELDS_SNAKE = [
  "original_amount",
  "vnd_revenue",
  "quantity",
  "unit_price",
] as const;

const NUMERIC_FIELDS_CAMEL = [
  "originalAmount",
  "vndRevenue",
  "quantity",
  "unitPrice",
] as const;

const MAX_PAGE_SIZE = 5000;

function normalizeBody(input: unknown): Record<string, unknown> {
  const b = toCamel(input as Record<string, unknown>);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    if ((NUMERIC_FIELDS_CAMEL as readonly string[]).includes(k)) {
      out[k] = String(v);
    } else if (k === "year" || k === "month") {
      out[k] = Number(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

revenuesRouter.get("/", validateQuery(listFilterSchema), async (req, res) => {
  const q = req.valid!.query as {
    year?: number;
    months: number[];
    q?: string;
    customer_id?: string;
    company_id?: string;
    division_id?: string;
    project_id?: string;
    project_type_id?: string;
    resource_id?: string;
    currency_id?: string;
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
  if (q.year !== undefined) conditions.push(eq(revenues.year, q.year));
  if (q.months.length > 0) conditions.push(inArray(revenues.month, q.months));
  if (q.customer_id) conditions.push(eq(revenues.customerId, q.customer_id));
  if (q.company_id) conditions.push(eq(revenues.companyId, q.company_id));
  if (q.division_id) conditions.push(eq(revenues.divisionId, q.division_id));
  if (q.project_id) conditions.push(eq(revenues.projectId, q.project_id));
  if (q.project_type_id)
    conditions.push(eq(revenues.projectTypeId, q.project_type_id));
  if (q.resource_id) conditions.push(eq(revenues.resourceId, q.resource_id));
  if (q.currency_id) conditions.push(eq(revenues.currencyId, q.currency_id));
  if (q.q) conditions.push(ilike(revenues.notes, `%${q.q}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(revenues)
    .where(whereClause);

  // Live VND revenue: compute on read. VND is hard-coded to rate 1 (any
  // VND row in exchange_rates is ignored) so totals are independent of
  // master-data noise. Other currencies use exchange_rates by (year, month).
  const liveVndRevenue = sql<string>`COALESCE(${revenues.originalAmount} * (
    SELECT
      CASE WHEN UPPER(${currencies.code}) = 'VND' THEN 1
      ELSE (
        SELECT ${exchangeRates.exchangeRate} FROM ${exchangeRates}
        WHERE ${exchangeRates.year} = ${revenues.year}
          AND ${exchangeRates.month} = ${revenues.month}
          AND ${exchangeRates.currencyId} = ${revenues.currencyId}
        LIMIT 1
      )
      END
    FROM ${currencies}
    WHERE ${currencies.id} = ${revenues.currencyId}
  ), 0)`;

  let query = db
    .select({
      id: revenues.id,
      year: revenues.year,
      month: revenues.month,
      customerId: revenues.customerId,
      companyId: revenues.companyId,
      divisionId: revenues.divisionId,
      projectId: revenues.projectId,
      projectTypeId: revenues.projectTypeId,
      resourceId: revenues.resourceId,
      currencyId: revenues.currencyId,
      projectName: revenues.projectName,
      unitPrice: revenues.unitPrice,
      quantity: revenues.quantity,
      originalAmount: revenues.originalAmount,
      vndRevenue: liveVndRevenue,
      notes: revenues.notes,
      createdAt: revenues.createdAt,
      updatedAt: revenues.updatedAt,
    })
    .from(revenues)
    .where(whereClause)
    .orderBy(desc(revenues.year), desc(revenues.month));

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

revenuesRouter.post(
  "/batch",
  requirePermission(PERM.REVENUES_WRITE),
  validateBody(revenueBatchSchema),
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
      const values = chunk.map((raw) => normalizeBody(raw));
      try {
        const inserted = await db
          .insert(revenues)
          .values(values as any)
          .returning();
        result.success += inserted.length;
        for (const row of inserted) {
          logDataEvent({
            req,
            resource: "revenues",
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

revenuesRouter.post(
  "/",
  requirePermission(PERM.REVENUES_WRITE),
  validateBody(revenueBodySchema),
  async (req: AuthedRequest, res) => {
    const values = normalizeBody(req.valid!.body);
    const [row] = await db.insert(revenues).values(values as any).returning();
    logDataEvent({
      req,
      resource: "revenues",
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

revenuesRouter.put(
  "/:id",
  requirePermission(PERM.REVENUES_WRITE),
  validateParams(paramsWithId),
  validateBody(revenueBodySchema.partial()),
  async (req: AuthedRequest, res) => {
    const patch = normalizeBody(req.valid!.body);
    patch.updatedAt = new Date();
    const [row] = await db
      .update(revenues)
      .set(patch as any)
      .where(eq(revenues.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "revenues",
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

revenuesRouter.post(
  "/bulk-delete",
  requirePermission(PERM.REVENUES_WRITE),
  validateBody(bulkDeleteSchema),
  async (req: AuthedRequest, res) => {
    const { year, months } = req.valid!.body as { year: number; months: number[] };
    const deleted = await db
      .delete(revenues)
      .where(and(eq(revenues.year, year), inArray(revenues.month, months)))
      .returning({ id: revenues.id });
    logDataEvent({
      req,
      resource: "revenues",
      resourceId: null,
      action: "bulk_delete",
    }).catch(() => {});
    res.json({ deleted: deleted.length });
  },
);

revenuesRouter.delete(
  "/:id",
  requirePermission(PERM.REVENUES_WRITE),
  validateParams(paramsWithId),
  async (req: AuthedRequest, res) => {
    const deleted = await db
      .delete(revenues)
      .where(eq(revenues.id, req.params.id))
      .returning({ id: revenues.id });
    if (deleted.length === 0)
      return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "revenues",
      resourceId: req.params.id,
      action: "delete",
    }).catch(() => {});
    res.status(204).send();
  },
);
