/**
 * Aggregate report endpoints — SQL GROUP BY on the server so the frontend
 * receives pre-aggregated rows instead of downloading the entire revenues /
 * costs / salary_costs tables and reducing client-side.
 *
 * Each endpoint returns the PRIMITIVES (sums grouped by a dimension). The
 * business formulas (gross profit, net profit, overhead per BMM, bonus, ...)
 * are applied in the frontend hooks so the single source of truth stays in
 * one place and refactors don't have to touch two layers.
 */
import { Router, type Response } from "express";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  revenues,
  costs,
  salaryCosts,
  companies,
  divisions,
  customers,
  costTypes,
  employees,
  bonusByC,
  bonusByD,
  exchangeRates,
  annualPlans,
  currencies,
} from "../schema";
import { requireAuth, requirePermission } from "../auth/middleware";
import { PERM } from "../auth/permissions";
import { validateQuery, yearSchema } from "../lib/validate";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);
reportsRouter.use(requirePermission(PERM.REPORTS_READ));

// -----------------------------------------------------------------------------
// Query schemas
// -----------------------------------------------------------------------------
const periodQuerySchema = z.object({
  year: yearSchema,
  months: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    ),
});

const yearOnlyQuerySchema = z.object({ year: yearSchema });

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function whereYearMonths<T>(
  yearCol: any,
  monthCol: any,
  year: number,
  months: number[],
  extra?: SQL,
) {
  const conds: SQL[] = [eq(yearCol, year)];
  if (months.length > 0 && months.length < 12) {
    conds.push(inArray(monthCol, months));
  }
  if (extra) conds.push(extra);
  return and(...conds);
}

/**
 * Live VND revenue per row: original_amount × rate where rate is:
 *   - 1 when currency code is VND (treated as constant — no need for an
 *     exchange_rates row), to keep totals stable regardless of any stale
 *     VND-to-VND row in the master data.
 *   - exchange_rates.exchange_rate looked up by (year, month, currency_id)
 *     for any other currency.
 *
 * Returns 0 when currency_id is NULL or, for non-VND currencies, when no
 * matching rate row exists — same semantics as calculateVNDRevenue (FE).
 */
const liveRevenueExpr = sql<string>`COALESCE(${revenues.originalAmount} * (
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

const liveRevenueSum = sql<string>`COALESCE(SUM(${liveRevenueExpr}), 0)`;

/**
 * Plan revenue in VND — same VND short-circuit + lookup semantics as
 * `liveRevenueExpr` but applied to annual_plans.
 */
const planRevenueExpr = sql<string>`COALESCE(${annualPlans.revenue} * (
  SELECT
    CASE WHEN UPPER(${currencies.code}) = 'VND' THEN 1
    ELSE (
      SELECT ${exchangeRates.exchangeRate} FROM ${exchangeRates}
      WHERE ${exchangeRates.year} = ${annualPlans.year}
        AND ${exchangeRates.month} = ${annualPlans.month}
        AND ${exchangeRates.currencyId} = ${annualPlans.currencyId}
      LIMIT 1
    )
    END
  FROM ${currencies}
  WHERE ${currencies.id} = ${annualPlans.currencyId}
), 0)`;

const planRevenueSum = sql<string>`COALESCE(SUM(${planRevenueExpr}), 0)`;

async function getSalaryCostTypeId(): Promise<string | null> {
  const [row] = await db
    .select({ id: costTypes.id })
    .from(costTypes)
    .where(eq(costTypes.code, "Salary"))
    .limit(1);
  return row?.id ?? null;
}

// -----------------------------------------------------------------------------
// GET /api/reports/monthly-summary?year=&months=
// Returns per-month totals of revenue and cost.
// Used by: useMonthlyRevenueStats, useBusinessReport.
// -----------------------------------------------------------------------------
reportsRouter.get(
  "/monthly-summary",
  validateQuery(periodQuerySchema),
  async (req, res: Response) => {
    const { year, months } = req.valid!.query as {
      year: number;
      months: number[];
    };
    const salaryTypeId = await getSalaryCostTypeId();

    const revenueRows = await db
      .select({
        month: revenues.month,
        totalRevenue: liveRevenueSum,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
        customerCount: sql<number>`COUNT(DISTINCT ${revenues.customerId})::int`,
      })
      .from(revenues)
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.month);

    const costRows = await db
      .select({
        month: costs.month,
        totalCost: sql<string>`COALESCE(SUM(${costs.cost}), 0)`,
        salaryCost: sql<string>`COALESCE(SUM(${costs.cost}) FILTER (WHERE ${costs.costType} = ${salaryTypeId}), 0)`,
      })
      .from(costs)
      .where(
        whereYearMonths(
          costs.year,
          costs.month,
          year,
          months,
          eq(costs.isCost, true),
        ),
      )
      .groupBy(costs.month);

    // Build { 1..12 => {...} }
    const byMonth = new Map<number, any>();
    for (const r of revenueRows) {
      byMonth.set(r.month, {
        month: r.month,
        total_revenue: Number(r.totalRevenue) || 0,
        total_bmm: Number(r.totalBmm) || 0,
        customer_count: r.customerCount,
        total_cost: 0,
        salary_cost: 0,
      });
    }
    for (const r of costRows) {
      const existing = byMonth.get(r.month) ?? {
        month: r.month,
        total_revenue: 0,
        total_bmm: 0,
        customer_count: 0,
        total_cost: 0,
        salary_cost: 0,
      };
      existing.total_cost = Number(r.totalCost) || 0;
      existing.salary_cost = Number(r.salaryCost) || 0;
      byMonth.set(r.month, existing);
    }

    // Ensure every requested month is present even if no data
    const out = months.map(
      (m) =>
        byMonth.get(m) ?? {
          month: m,
          total_revenue: 0,
          total_cost: 0,
          total_bmm: 0,
          customer_count: 0,
          salary_cost: 0,
        },
    );
    out.sort((a, b) => a.month - b.month);

    res.json(out);
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/top-customers?year=&months=&limit=10
// Top customers by revenue.
// -----------------------------------------------------------------------------
const topCustomersQuery = periodQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

reportsRouter.get(
  "/top-customers",
  validateQuery(topCustomersQuery),
  async (req, res: Response) => {
    const { year, months, limit } = req.valid!.query as {
      year: number;
      months: number[];
      limit: number;
    };
    const rows = await db
      .select({
        customerId: revenues.customerId,
        customerCode: customers.code,
        customerName: customers.name,
        totalRevenue: liveRevenueSum,
      })
      .from(revenues)
      .leftJoin(customers, eq(revenues.customerId, customers.id))
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.customerId, customers.code, customers.name)
      .orderBy(sql`SUM(${liveRevenueExpr}) DESC`)
      .limit(limit);

    res.json(
      rows.map((r) => ({
        customer_id: r.customerId,
        customer_code: r.customerCode,
        customer_name: r.customerName,
        total_revenue: Number(r.totalRevenue) || 0,
      })),
    );
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/dashboard?year=&months=
// Pre-aggregated primitives for current + previous period.
// -----------------------------------------------------------------------------
async function getDashboardPeriod(year: number, months: number[]) {
  const salaryTypeId = await getSalaryCostTypeId();

  const [rev] = await db
    .select({
      totalRevenue: liveRevenueSum,
      totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
      customerCount: sql<number>`COUNT(DISTINCT ${revenues.customerId})::int`,
    })
    .from(revenues)
    .where(whereYearMonths(revenues.year, revenues.month, year, months));

  const [co] = await db
    .select({
      totalCost: sql<string>`COALESCE(SUM(${costs.cost}), 0)`,
      salaryCost: sql<string>`COALESCE(SUM(${costs.cost}) FILTER (WHERE ${costs.costType} = ${salaryTypeId}), 0)`,
    })
    .from(costs)
    .where(
      whereYearMonths(
        costs.year,
        costs.month,
        year,
        months,
        eq(costs.isCost, true),
      ),
    );

  // Employee CWD / CMM aggregation — sum per employee then apply factors JS-side
  // would still require pulling all rows. Instead compute in SQL using a
  // convert factor lookup table expressed as a CASE.
  //
  // Convert factors (from @/types/employee):
  //   Full-time → 1, Part-time → 0.5 (anything else → 1 as default)
  // Business days per (year, month) is computed here conservatively as 22
  // weekdays/month when the frontend does NOT have business-day data
  // available either. (The frontend uses getBusinessDays which returns an
  // approximate number too.)
  const empRows = await db
    .select({
      year: employees.year,
      month: employees.month,
      category: employees.category,
      type: employees.type,
      workingDay: employees.workingDay,
    })
    .from(employees)
    .where(whereYearMonths(employees.year, employees.month, year, months));

  // Apply the same convert factors the FE uses. Keep in sync with
  // src/types/employee.ts → getConvertFactor.
  const convertFactor = (type: string): number => {
    const t = (type || "").toLowerCase();
    if (t === "part-time" || t === "parttime" || t === "part time") return 0.5;
    return 1;
  };
  // Approximate business-days per month. Keep in sync with FE fallback.
  const businessDays = 22;

  let totalCwd = 0;
  let overheadCwd = 0;
  let totalCmm = 0;
  let devCmm = 0;
  for (const emp of empRows) {
    const cwd = (Number(emp.workingDay) || 0) * convertFactor(emp.type);
    totalCwd += cwd;
    if ((emp.category || "").toLowerCase() === "overhead") overheadCwd += cwd;
    const empCmm = businessDays > 0 ? cwd / businessDays : 0;
    totalCmm += empCmm;
    if ((emp.category || "").toLowerCase() === "development") devCmm += empCmm;
  }

  const [plan] = await db
    .select({
      planRevenue: planRevenueSum,
      planBmm: sql<string>`COALESCE(SUM(${annualPlans.bmm}), 0)`,
    })
    .from(annualPlans)
    .where(whereYearMonths(annualPlans.year, annualPlans.month, year, months));

  return {
    total_revenue: Number(rev.totalRevenue) || 0,
    total_cost: Number(co.totalCost) || 0,
    salary_cost: Number(co.salaryCost) || 0,
    total_bmm: Number(rev.totalBmm) || 0,
    customer_count: rev.customerCount,
    total_cwd: totalCwd,
    overhead_cwd: overheadCwd,
    total_cmm: totalCmm,
    dev_cmm: devCmm,
    plan_revenue: Number(plan.planRevenue) || 0,
    plan_bmm: Number(plan.planBmm) || 0,
  };
}

reportsRouter.get(
  "/dashboard",
  validateQuery(periodQuerySchema),
  async (req, res: Response) => {
    const { year, months } = req.valid!.query as {
      year: number;
      months: number[];
    };

    const [current, previous] = await Promise.all([
      getDashboardPeriod(year, months),
      getDashboardPeriod(year - 1, months),
    ]);

    res.json({ current, previous });
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/company-summary?year=&months=
// Per (year, month, company_id): bmm, revenue.
// Plus period-level totals so the FE can compute overhead per BMM.
// -----------------------------------------------------------------------------
reportsRouter.get(
  "/company-summary",
  validateQuery(periodQuerySchema),
  async (req, res: Response) => {
    const { year, months } = req.valid!.query as {
      year: number;
      months: number[];
    };
    const salaryTypeId = await getSalaryCostTypeId();

    // Per (year, month, company_id) revenue + bmm
    const revenueRows = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        companyId: revenues.companyId,
        companyCode: companies.code,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
        totalRevenue: liveRevenueSum,
      })
      .from(revenues)
      .leftJoin(companies, eq(revenues.companyId, companies.id))
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.year, revenues.month, revenues.companyId, companies.code);

    // Per (year, month, company_id) salary cost from salary_costs
    const salaryRows = await db
      .select({
        year: salaryCosts.year,
        month: salaryCosts.month,
        companyId: salaryCosts.companyId,
        salaryCost: sql<string>`COALESCE(SUM(${salaryCosts.amount}), 0)`,
      })
      .from(salaryCosts)
      .where(
        whereYearMonths(salaryCosts.year, salaryCosts.month, year, months),
      )
      .groupBy(salaryCosts.year, salaryCosts.month, salaryCosts.companyId);

    // Period totals (per month)
    const monthTotals = await db
      .select({
        year: costs.year,
        month: costs.month,
        totalCost: sql<string>`COALESCE(SUM(${costs.cost}), 0)`,
        salaryCostFromCosts: sql<string>`COALESCE(SUM(${costs.cost}) FILTER (WHERE ${costs.costType} = ${salaryTypeId}), 0)`,
      })
      .from(costs)
      .where(
        whereYearMonths(
          costs.year,
          costs.month,
          year,
          months,
          eq(costs.isCost, true),
        ),
      )
      .groupBy(costs.year, costs.month);

    const revenueTotals = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        totalRevenue: liveRevenueSum,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
      })
      .from(revenues)
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.year, revenues.month);

    const salaryTotals = await db
      .select({
        year: salaryCosts.year,
        month: salaryCosts.month,
        totalSalary: sql<string>`COALESCE(SUM(${salaryCosts.amount}), 0)`,
      })
      .from(salaryCosts)
      .where(
        whereYearMonths(salaryCosts.year, salaryCosts.month, year, months),
      )
      .groupBy(salaryCosts.year, salaryCosts.month);

    // Bonus by company (year-level)
    const bonusRows = await db
      .select({ companyId: bonusByC.companyId, bnBmm: bonusByC.bnBmm })
      .from(bonusByC)
      .where(eq(bonusByC.year, year));

    res.json({
      groups: revenueRows.map((r) => ({
        year: r.year,
        month: r.month,
        company_id: r.companyId,
        company_code: r.companyCode ?? "N/A",
        total_bmm: Number(r.totalBmm) || 0,
        total_revenue: Number(r.totalRevenue) || 0,
      })),
      company_salary: salaryRows.map((r) => ({
        year: r.year,
        month: r.month,
        company_id: r.companyId,
        salary_cost: Number(r.salaryCost) || 0,
      })),
      month_totals: monthTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_cost: Number(r.totalCost) || 0,
        salary_cost_from_costs: Number(r.salaryCostFromCosts) || 0,
      })),
      revenue_totals: revenueTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_revenue: Number(r.totalRevenue) || 0,
        total_bmm: Number(r.totalBmm) || 0,
      })),
      salary_totals: salaryTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_salary: Number(r.totalSalary) || 0,
      })),
      bonus_by_company: bonusRows.map((r) => ({
        company_id: r.companyId,
        bn_bmm: Number(r.bnBmm) || 0,
      })),
    });
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/division-summary?year=&months=
// Same shape as company-summary but grouped by division_id.
// -----------------------------------------------------------------------------
reportsRouter.get(
  "/division-summary",
  validateQuery(periodQuerySchema),
  async (req, res: Response) => {
    const { year, months } = req.valid!.query as {
      year: number;
      months: number[];
    };
    const salaryTypeId = await getSalaryCostTypeId();

    const revenueRows = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        divisionId: revenues.divisionId,
        divisionCode: divisions.code,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
        totalRevenue: liveRevenueSum,
      })
      .from(revenues)
      .leftJoin(divisions, eq(revenues.divisionId, divisions.id))
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(
        revenues.year,
        revenues.month,
        revenues.divisionId,
        divisions.code,
      );

    const salaryRows = await db
      .select({
        year: salaryCosts.year,
        month: salaryCosts.month,
        divisionId: salaryCosts.divisionId,
        salaryCost: sql<string>`COALESCE(SUM(${salaryCosts.amount}), 0)`,
      })
      .from(salaryCosts)
      .where(
        whereYearMonths(salaryCosts.year, salaryCosts.month, year, months),
      )
      .groupBy(salaryCosts.year, salaryCosts.month, salaryCosts.divisionId);

    const monthTotals = await db
      .select({
        year: costs.year,
        month: costs.month,
        totalCost: sql<string>`COALESCE(SUM(${costs.cost}), 0)`,
        salaryCostFromCosts: sql<string>`COALESCE(SUM(${costs.cost}) FILTER (WHERE ${costs.costType} = ${salaryTypeId}), 0)`,
      })
      .from(costs)
      .where(
        whereYearMonths(
          costs.year,
          costs.month,
          year,
          months,
          eq(costs.isCost, true),
        ),
      )
      .groupBy(costs.year, costs.month);

    const revenueTotals = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        totalRevenue: liveRevenueSum,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
      })
      .from(revenues)
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.year, revenues.month);

    const salaryTotals = await db
      .select({
        year: salaryCosts.year,
        month: salaryCosts.month,
        totalSalary: sql<string>`COALESCE(SUM(${salaryCosts.amount}), 0)`,
      })
      .from(salaryCosts)
      .where(
        whereYearMonths(salaryCosts.year, salaryCosts.month, year, months),
      )
      .groupBy(salaryCosts.year, salaryCosts.month);

    const bonusRows = await db
      .select({ divisionId: bonusByD.divisionId, bnBmm: bonusByD.bnBmm })
      .from(bonusByD)
      .where(eq(bonusByD.year, year));

    res.json({
      groups: revenueRows.map((r) => ({
        year: r.year,
        month: r.month,
        division_id: r.divisionId,
        division_code: r.divisionCode ?? "N/A",
        total_bmm: Number(r.totalBmm) || 0,
        total_revenue: Number(r.totalRevenue) || 0,
      })),
      division_salary: salaryRows.map((r) => ({
        year: r.year,
        month: r.month,
        division_id: r.divisionId,
        salary_cost: Number(r.salaryCost) || 0,
      })),
      month_totals: monthTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_cost: Number(r.totalCost) || 0,
        salary_cost_from_costs: Number(r.salaryCostFromCosts) || 0,
      })),
      revenue_totals: revenueTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_revenue: Number(r.totalRevenue) || 0,
        total_bmm: Number(r.totalBmm) || 0,
      })),
      salary_totals: salaryTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_salary: Number(r.totalSalary) || 0,
      })),
      bonus_by_division: bonusRows.map((r) => ({
        division_id: r.divisionId,
        bn_bmm: Number(r.bnBmm) || 0,
      })),
    });
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/customer-summary?year=&months=
// Per (year, month, customer_id): bmm, revenue.
// Plus period totals for overhead calc.
// -----------------------------------------------------------------------------
reportsRouter.get(
  "/customer-summary",
  validateQuery(periodQuerySchema),
  async (req, res: Response) => {
    const { year, months } = req.valid!.query as {
      year: number;
      months: number[];
    };
    const salaryTypeId = await getSalaryCostTypeId();

    const revenueRows = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        customerId: revenues.customerId,
        customerCode: customers.code,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
        totalRevenue: liveRevenueSum,
      })
      .from(revenues)
      .leftJoin(customers, eq(revenues.customerId, customers.id))
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(
        revenues.year,
        revenues.month,
        revenues.customerId,
        customers.code,
      );

    // Customer-level salary (from salary_costs.customer_id)
    const customerSalaryRows = await db
      .select({
        year: salaryCosts.year,
        month: salaryCosts.month,
        customerId: salaryCosts.customerId,
        salaryCost: sql<string>`COALESCE(SUM(${salaryCosts.amount}), 0)`,
      })
      .from(salaryCosts)
      .where(
        whereYearMonths(salaryCosts.year, salaryCosts.month, year, months),
      )
      .groupBy(salaryCosts.year, salaryCosts.month, salaryCosts.customerId);

    const monthTotals = await db
      .select({
        year: costs.year,
        month: costs.month,
        totalCost: sql<string>`COALESCE(SUM(${costs.cost}), 0)`,
        salaryCostFromCosts: sql<string>`COALESCE(SUM(${costs.cost}) FILTER (WHERE ${costs.costType} = ${salaryTypeId}), 0)`,
      })
      .from(costs)
      .where(
        whereYearMonths(
          costs.year,
          costs.month,
          year,
          months,
          eq(costs.isCost, true),
        ),
      )
      .groupBy(costs.year, costs.month);

    const revenueTotals = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        totalRevenue: liveRevenueSum,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
      })
      .from(revenues)
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.year, revenues.month);

    const bonusRows = await db
      .select({ companyId: bonusByC.companyId, bnBmm: bonusByC.bnBmm })
      .from(bonusByC)
      .where(eq(bonusByC.year, year));

    // Per (year, month, company_id) revenue bmm — needed for company salary-bonus allocation
    const companyBmmRows = await db
      .select({
        year: revenues.year,
        month: revenues.month,
        companyId: revenues.companyId,
        totalBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
      })
      .from(revenues)
      .where(whereYearMonths(revenues.year, revenues.month, year, months))
      .groupBy(revenues.year, revenues.month, revenues.companyId);

    res.json({
      groups: revenueRows.map((r) => ({
        year: r.year,
        month: r.month,
        customer_id: r.customerId,
        customer_code: r.customerCode ?? "N/A",
        total_bmm: Number(r.totalBmm) || 0,
        total_revenue: Number(r.totalRevenue) || 0,
      })),
      customer_salary: customerSalaryRows.map((r) => ({
        year: r.year,
        month: r.month,
        customer_id: r.customerId,
        salary_cost: Number(r.salaryCost) || 0,
      })),
      month_totals: monthTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_cost: Number(r.totalCost) || 0,
        salary_cost_from_costs: Number(r.salaryCostFromCosts) || 0,
      })),
      revenue_totals: revenueTotals.map((r) => ({
        year: r.year,
        month: r.month,
        total_revenue: Number(r.totalRevenue) || 0,
        total_bmm: Number(r.totalBmm) || 0,
      })),
      bonus_by_company: bonusRows.map((r) => ({
        company_id: r.companyId,
        bn_bmm: Number(r.bnBmm) || 0,
      })),
      company_bmm: companyBmmRows.map((r) => ({
        year: r.year,
        month: r.month,
        company_id: r.companyId,
        total_bmm: Number(r.totalBmm) || 0,
      })),
    });
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/business-summary?year=
// 12 months: revenue, cost, salary cost. FE applies tax/bonus formulas.
// -----------------------------------------------------------------------------
reportsRouter.get(
  "/business-summary",
  validateQuery(yearOnlyQuerySchema),
  async (req, res: Response) => {
    const { year } = req.valid!.query as { year: number };
    const salaryTypeId = await getSalaryCostTypeId();

    const revenueRows = await db
      .select({
        month: revenues.month,
        totalRevenue: liveRevenueSum,
      })
      .from(revenues)
      .where(eq(revenues.year, year))
      .groupBy(revenues.month);

    const costRows = await db
      .select({
        month: costs.month,
        totalCost: sql<string>`COALESCE(SUM(${costs.cost}), 0)`,
        salaryCost: sql<string>`COALESCE(SUM(${costs.cost}) FILTER (WHERE ${costs.costType} = ${salaryTypeId}), 0)`,
      })
      .from(costs)
      .where(eq(costs.year, year))
      .groupBy(costs.month);

    const byMonth = new Map<number, any>();
    for (let m = 1; m <= 12; m++) {
      byMonth.set(m, {
        year,
        month: m,
        total_revenue: 0,
        total_cost: 0,
        salary_cost: 0,
      });
    }
    for (const r of revenueRows) {
      const e = byMonth.get(r.month)!;
      e.total_revenue = Number(r.totalRevenue) || 0;
    }
    for (const r of costRows) {
      const e = byMonth.get(r.month)!;
      e.total_cost = Number(r.totalCost) || 0;
      e.salary_cost = Number(r.salaryCost) || 0;
    }

    res.json(Array.from(byMonth.values()).sort((a, b) => a.month - b.month));
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/plan-vs-actual?year=
// 12 months: revenue plan (VND) vs actual (VND), bmm plan vs actual.
// Both revenues converted live via exchange_rates so totals follow current rate.
// -----------------------------------------------------------------------------
reportsRouter.get(
  "/plan-vs-actual",
  validateQuery(yearOnlyQuerySchema),
  async (req, res: Response) => {
    const { year } = req.valid!.query as { year: number };

    const planRows = await db
      .select({
        month: annualPlans.month,
        planRevenue: planRevenueSum,
        planBmm: sql<string>`COALESCE(SUM(${annualPlans.bmm}), 0)`,
      })
      .from(annualPlans)
      .where(eq(annualPlans.year, year))
      .groupBy(annualPlans.month);

    const actualRows = await db
      .select({
        month: revenues.month,
        actualRevenue: liveRevenueSum,
        actualBmm: sql<string>`COALESCE(SUM(${revenues.quantity}), 0)`,
      })
      .from(revenues)
      .where(eq(revenues.year, year))
      .groupBy(revenues.month);

    const byMonth = new Map<
      number,
      {
        month: number;
        plan_revenue: number;
        actual_revenue: number;
        plan_bmm: number;
        actual_bmm: number;
      }
    >();
    for (let m = 1; m <= 12; m++) {
      byMonth.set(m, {
        month: m,
        plan_revenue: 0,
        actual_revenue: 0,
        plan_bmm: 0,
        actual_bmm: 0,
      });
    }
    for (const r of planRows) {
      const e = byMonth.get(r.month)!;
      e.plan_revenue = Number(r.planRevenue) || 0;
      e.plan_bmm = Number(r.planBmm) || 0;
    }
    for (const r of actualRows) {
      const e = byMonth.get(r.month)!;
      e.actual_revenue = Number(r.actualRevenue) || 0;
      e.actual_bmm = Number(r.actualBmm) || 0;
    }

    res.json(Array.from(byMonth.values()).sort((a, b) => a.month - b.month));
  },
);

// -----------------------------------------------------------------------------
// GET /api/reports/available-years
// Returns the set of years that have revenue data, plus the current year.
// -----------------------------------------------------------------------------
reportsRouter.get("/available-years", async (_req, res) => {
  const rows = await db
    .select({ year: revenues.year })
    .from(revenues)
    .groupBy(revenues.year)
    .orderBy(sql`${revenues.year} DESC`);
  const set = new Set<number>([new Date().getFullYear()]);
  for (const r of rows) set.add(r.year);
  res.json(Array.from(set).sort((a, b) => b - a));
});
