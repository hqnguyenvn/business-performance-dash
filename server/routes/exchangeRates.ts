import { Router } from "express";
import { db } from "../db";
import { exchangeRates, currencies } from "../schema";
import { eq, desc } from "drizzle-orm";
import { toSnake, coerceNumeric } from "../lib/serialize";
import {
  requireAuth,
  requirePermission,
  type AuthedRequest,
} from "../auth/middleware";
import { PERM } from "../auth/permissions";
import { validateBody, validateParams, paramsWithId } from "../lib/validate";
import { exchangeRateBodySchema } from "../lib/schemas";
import { logDataEvent } from "../lib/audit";

const NUMERIC_FIELDS_SNAKE = ["exchange_rate"] as const;

export const exchangeRatesRouter = Router();

exchangeRatesRouter.use(requireAuth);
exchangeRatesRouter.use(requirePermission(PERM.EXCHANGE_RATES_READ));

// GET /api/exchange-rates  — join currencies để trả thêm currency_code
exchangeRatesRouter.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: exchangeRates.id,
      year: exchangeRates.year,
      month: exchangeRates.month,
      currencyId: exchangeRates.currencyId,
      exchangeRate: exchangeRates.exchangeRate,
      currencyCode: currencies.code,
      createdAt: exchangeRates.createdAt,
      updatedAt: exchangeRates.updatedAt,
    })
    .from(exchangeRates)
    .leftJoin(currencies, eq(exchangeRates.currencyId, currencies.id))
    .orderBy(desc(exchangeRates.year), desc(exchangeRates.month));
  res.json(
    rows.map((r) =>
      coerceNumeric(toSnake(r as Record<string, unknown>), NUMERIC_FIELDS_SNAKE),
    ),
  );
});

function readBody(input: unknown) {
  const b = input as Record<string, unknown>;
  const currencyId =
    typeof b.currency_id === "string"
      ? b.currency_id
      : typeof b.currencyId === "string"
        ? b.currencyId
        : null;
  const exchangeRate =
    b.exchange_rate !== undefined ? b.exchange_rate : b.exchangeRate;
  return {
    year: Number(b.year),
    month: Number(b.month),
    currencyId: currencyId as string,
    exchangeRate: String(exchangeRate),
  };
}

/**
 * VND is treated as a constant rate of 1 across the app — there is no point
 * storing it in master data. Reject any insert/update that targets a VND
 * currency row to keep the table clean.
 */
async function rejectIfVnd(currencyId: string | null): Promise<string | null> {
  if (!currencyId) return null;
  const [row] = await db
    .select({ code: currencies.code })
    .from(currencies)
    .where(eq(currencies.id, currencyId))
    .limit(1);
  if (row && (row.code || "").toUpperCase() === "VND") {
    return "VND có tỷ giá luôn = 1; không cần (và không cho phép) thêm vào bảng tỷ giá.";
  }
  return null;
}

exchangeRatesRouter.post(
  "/",
  requirePermission(PERM.EXCHANGE_RATES_WRITE),
  validateBody(exchangeRateBodySchema),
  async (req: AuthedRequest, res) => {
    const body = readBody(req.valid!.body);
    if (!body.currencyId) {
      return res.status(400).json({ error: "currency_id is required" });
    }
    const vndError = await rejectIfVnd(body.currencyId);
    if (vndError) return res.status(400).json({ error: vndError });
    const [row] = await db
      .insert(exchangeRates)
      .values(body)
      .returning();
    logDataEvent({
      req,
      resource: "exchange_rates",
      resourceId: row.id,
      action: "create",
    }).catch(() => {});
    res.json(
      coerceNumeric(toSnake(row as Record<string, unknown>), NUMERIC_FIELDS_SNAKE),
    );
  },
);

exchangeRatesRouter.put(
  "/:id",
  requirePermission(PERM.EXCHANGE_RATES_WRITE),
  validateParams(paramsWithId),
  validateBody(exchangeRateBodySchema),
  async (req: AuthedRequest, res) => {
    const body = readBody(req.valid!.body);
    const vndError = await rejectIfVnd(body.currencyId);
    if (vndError) return res.status(400).json({ error: vndError });
    const [row] = await db
      .update(exchangeRates)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(exchangeRates.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "exchange_rates",
      resourceId: req.params.id,
      action: "update",
    }).catch(() => {});
    res.json(
      coerceNumeric(toSnake(row as Record<string, unknown>), NUMERIC_FIELDS_SNAKE),
    );
  },
);

exchangeRatesRouter.delete(
  "/:id",
  requirePermission(PERM.EXCHANGE_RATES_WRITE),
  validateParams(paramsWithId),
  async (req: AuthedRequest, res) => {
    const deleted = await db
      .delete(exchangeRates)
      .where(eq(exchangeRates.id, req.params.id))
      .returning({ id: exchangeRates.id });
    if (deleted.length === 0)
      return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "exchange_rates",
      resourceId: req.params.id,
      action: "delete",
    }).catch(() => {});
    res.status(204).send();
  },
);
