import { Router } from "express";
import { db } from "../db";
import { annualPlans } from "../schema";
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
  annualPlanBodySchema,
  annualPlanBatchSchema,
  annualPlanBulkUpsertSchema,
  listFilterSchema,
} from "../lib/schemas";
import { logDataEvent } from "../lib/audit";

export const plansRouter = Router();

plansRouter.use(requireAuth);
plansRouter.use(requirePermission(PERM.PLANS_READ));

const NUMERIC_FIELDS_SNAKE = ["bmm", "revenue"] as const;
const NUMERIC_FIELDS_CAMEL = ["bmm", "revenue"] as const;
const MAX_PAGE_SIZE = 5000;

function normalizeBody(input: unknown): Record<string, unknown> {
  const b = toCamel(input as Record<string, unknown>);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (k === "id") continue;
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

function friendlyDbError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : "Unknown error";
  // Drizzle wraps the underlying pg error; the constraint name lives on .cause
  const cause: any = (err as any)?.cause ?? err;
  const code: string | undefined = cause?.code;
  const constraint: string | undefined = cause?.constraint;
  const detail: string | undefined = cause?.detail;
  const haystack = `${msg} ${constraint ?? ""} ${detail ?? ""}`.toLowerCase();
  if (
    code === "23505" ||
    haystack.includes("uq_annual_plans_year_month_company")
  ) {
    return {
      status: 409,
      message:
        "Plan đã tồn tại cho (năm, tháng, company) này — mỗi tổ hợp chỉ được nhập 1 dòng.",
    };
  }
  return { status: 500, message: msg };
}

// -----------------------------------------------------------------------------
// GET /api/plans?year=&months=&company_id=&q=&page=&page_size=
// -----------------------------------------------------------------------------
plansRouter.get("/", validateQuery(listFilterSchema), async (req, res) => {
  const q = req.valid!.query as {
    year?: number;
    months: number[];
    q?: string;
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
  if (q.year !== undefined) conditions.push(eq(annualPlans.year, q.year));
  if (q.months.length > 0) conditions.push(inArray(annualPlans.month, q.months));
  if (q.company_id) conditions.push(eq(annualPlans.companyId, q.company_id));
  if (q.q) conditions.push(ilike(annualPlans.notes, `%${q.q}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(annualPlans)
    .where(whereClause);

  let query = db
    .select()
    .from(annualPlans)
    .where(whereClause)
    .orderBy(desc(annualPlans.year), desc(annualPlans.month));

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

// -----------------------------------------------------------------------------
// POST /api/plans/batch — bulk insert (used by Excel import for new rows)
// -----------------------------------------------------------------------------
plansRouter.post(
  "/batch",
  requirePermission(PERM.PLANS_WRITE),
  validateBody(annualPlanBatchSchema),
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
          .insert(annualPlans)
          .values(values as any)
          .returning();
        result.success += inserted.length;
      } catch (err) {
        result.failed += chunk.length;
        const { message } = friendlyDbError(err);
        chunk.forEach((_, idx) => {
          result.errors.push({ index: i + idx, error: message });
        });
      }
    }
    if (result.success > 0) {
      logDataEvent({
        req,
        resource: "annual_plans",
        resourceId: null,
        action: "create",
        metadata: { source: "batch", count: result.success },
      }).catch(() => {});
    }
    res.json(result);
  },
);

// -----------------------------------------------------------------------------
// POST /api/plans/bulk-upsert — used by Excel import to insert+update mixed
// -----------------------------------------------------------------------------
plansRouter.post(
  "/bulk-upsert",
  requirePermission(PERM.PLANS_WRITE),
  validateBody(annualPlanBulkUpsertSchema),
  async (req: AuthedRequest, res) => {
    const list = req.valid!.body as unknown as Array<Record<string, unknown>>;
    const result = {
      created: 0,
      updated: 0,
      errors: [] as { index: number; error: string }[],
    };
    if (list.length === 0) return res.json(result);

    const toInsert: { idx: number; values: Record<string, unknown> }[] = [];
    const toUpdate: {
      idx: number;
      id: string;
      values: Record<string, unknown>;
    }[] = [];
    list.forEach((raw, idx) => {
      const values = normalizeBody(raw);
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
            .insert(annualPlans)
            .values(chunk.map((c) => c.values) as any)
            .returning({ id: annualPlans.id });
          result.created += inserted.length;
        }
        for (const u of toUpdate) {
          const patch = { ...u.values, updatedAt: new Date() };
          const updated = await tx
            .update(annualPlans)
            .set(patch as any)
            .where(eq(annualPlans.id, u.id))
            .returning({ id: annualPlans.id });
          if (updated.length === 0) {
            result.errors.push({ index: u.idx, error: "Row not found" });
          } else {
            result.updated += 1;
          }
        }
      });
    } catch (err) {
      const { status, message } = friendlyDbError(err);
      return res.status(status).json({ error: message });
    }

    if (result.created > 0) {
      logDataEvent({
        req,
        resource: "annual_plans",
        resourceId: null,
        action: "create",
        metadata: { source: "bulk_upsert", count: result.created },
      }).catch(() => {});
    }
    if (result.updated > 0) {
      logDataEvent({
        req,
        resource: "annual_plans",
        resourceId: null,
        action: "update",
        metadata: { source: "bulk_upsert", count: result.updated },
      }).catch(() => {});
    }
    res.json(result);
  },
);

// -----------------------------------------------------------------------------
// POST /api/plans — create single
// -----------------------------------------------------------------------------
plansRouter.post(
  "/",
  requirePermission(PERM.PLANS_WRITE),
  validateBody(annualPlanBodySchema),
  async (req: AuthedRequest, res) => {
    const values = normalizeBody(req.valid!.body);
    try {
      const [row] = await db
        .insert(annualPlans)
        .values(values as any)
        .returning();
      logDataEvent({
        req,
        resource: "annual_plans",
        resourceId: (row as any).id,
        action: "create",
      }).catch(() => {});
      res.json(
        coerceNumeric(
          toSnake(row as Record<string, unknown>),
          NUMERIC_FIELDS_SNAKE,
        ),
      );
    } catch (err) {
      const { status, message } = friendlyDbError(err);
      return res.status(status).json({ error: message });
    }
  },
);

// -----------------------------------------------------------------------------
// PUT /api/plans/:id — partial update
// -----------------------------------------------------------------------------
plansRouter.put(
  "/:id",
  requirePermission(PERM.PLANS_WRITE),
  validateParams(paramsWithId),
  validateBody(annualPlanBodySchema.partial()),
  async (req: AuthedRequest, res) => {
    const patch = normalizeBody(req.valid!.body);
    patch.updatedAt = new Date();
    try {
      const [row] = await db
        .update(annualPlans)
        .set(patch as any)
        .where(eq(annualPlans.id, req.params.id))
        .returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      logDataEvent({
        req,
        resource: "annual_plans",
        resourceId: req.params.id,
        action: "update",
      }).catch(() => {});
      res.json(
        coerceNumeric(
          toSnake(row as Record<string, unknown>),
          NUMERIC_FIELDS_SNAKE,
        ),
      );
    } catch (err) {
      const { status, message } = friendlyDbError(err);
      return res.status(status).json({ error: message });
    }
  },
);

// -----------------------------------------------------------------------------
// POST /api/plans/bulk-delete — { year, months }
// -----------------------------------------------------------------------------
const bulkDeleteSchema = z.object({
  year: z.number().int().min(1900).max(3000),
  months: z.array(z.number().int().min(1).max(12)).min(1),
});

plansRouter.post(
  "/bulk-delete",
  requirePermission(PERM.PLANS_WRITE),
  validateBody(bulkDeleteSchema),
  async (req: AuthedRequest, res) => {
    const { year, months } = req.valid!.body as {
      year: number;
      months: number[];
    };
    const deleted = await db
      .delete(annualPlans)
      .where(
        and(eq(annualPlans.year, year), inArray(annualPlans.month, months)),
      )
      .returning({ id: annualPlans.id });
    logDataEvent({
      req,
      resource: "annual_plans",
      resourceId: null,
      action: "delete",
      metadata: { source: "bulk_delete", count: deleted.length },
    }).catch(() => {});
    res.json({ deleted: deleted.length });
  },
);

// -----------------------------------------------------------------------------
// DELETE /api/plans/:id
// -----------------------------------------------------------------------------
plansRouter.delete(
  "/:id",
  requirePermission(PERM.PLANS_WRITE),
  validateParams(paramsWithId),
  async (req: AuthedRequest, res) => {
    const deleted = await db
      .delete(annualPlans)
      .where(eq(annualPlans.id, req.params.id))
      .returning({ id: annualPlans.id });
    if (deleted.length === 0)
      return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "annual_plans",
      resourceId: req.params.id,
      action: "delete",
    }).catch(() => {});
    res.status(204).send();
  },
);
