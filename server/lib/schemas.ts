/**
 * Zod schemas for request bodies — one per resource. These are the ONLY way
 * to write to the DB; anything not listed in a schema cannot be inserted
 * (mass-assignment defense).
 *
 * Use `.strict()` so unknown keys are rejected rather than silently dropped.
 */
import { z } from "zod";
import {
  uuidSchema,
  yearSchema,
  monthSchema,
  optionalShortString,
  optionalLongString,
} from "./validate";

const optionalUuid = uuidSchema.nullable().optional();
const optionalNumericString = z
  .union([z.number(), z.string(), z.null()])
  .optional();

// -----------------------------------------------------------------------------
// Master data (companies, divisions, customers, projects, project_types,
// resources, currencies, cost_types, roles) — shared shape
// -----------------------------------------------------------------------------
export const masterDataBodySchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    description: optionalLongString,
  })
  .strict()
  .passthrough(); // allow FKs like company_id passed by divisions/projects

// Tighter variant for divisions/projects which have ONE extra FK
export const divisionBodySchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    description: optionalLongString,
    company_id: optionalUuid,
    companyId: optionalUuid,
  })
  .strict();

export const projectBodySchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    description: optionalLongString,
    customer_id: optionalUuid,
    customerId: optionalUuid,
    group_code: z.string().trim().max(64).nullable().optional(),
    groupCode: z.string().trim().max(64).nullable().optional(),
  })
  .strict();

// -----------------------------------------------------------------------------
// Parameter
// -----------------------------------------------------------------------------
export const parameterBodySchema = z
  .object({
    year: yearSchema,
    code: z.string().trim().min(1).max(64),
    value: z.union([z.number(), z.string()]).transform((v) => String(v)),
    descriptions: optionalLongString,
  })
  .strict();

// -----------------------------------------------------------------------------
// Exchange rates
// -----------------------------------------------------------------------------
export const exchangeRateBodySchema = z
  .object({
    year: yearSchema,
    month: monthSchema,
    currency_id: uuidSchema.optional(),
    currencyId: uuidSchema.optional(),
    currency_code: z.string().trim().max(10).optional(),
    exchange_rate: z.union([z.number(), z.string()]).transform((v) => String(v)),
    exchangeRate: z.union([z.number(), z.string()]).optional(),
  })
  .strict();

// -----------------------------------------------------------------------------
// Employees
// -----------------------------------------------------------------------------
export const employeeBodySchema = z
  .object({
    year: yearSchema,
    month: monthSchema,
    username: z.string().trim().max(255).default(""),
    name: z.string().trim().max(255).default(""),
    type: z.string().trim().max(64).default(""),
    category: z.string().trim().max(64).default(""),
    status: z.string().trim().max(32).default("Working"),
    division_id: optionalUuid,
    divisionId: optionalUuid,
    role_id: optionalUuid,
    roleId: optionalUuid,
    working_day: z.union([z.number(), z.string()]).default(0),
    workingDay: z.union([z.number(), z.string()]).optional(),
  })
  .strict();

export const employeeBulkUpsertSchema = z
  .array(employeeBodySchema.extend({ id: uuidSchema.optional() }))
  .max(5000);

// -----------------------------------------------------------------------------
// Annual Plans — kế hoạch năm theo (year, month, company). One row per group.
// -----------------------------------------------------------------------------
export const annualPlanBodySchema = z
  .object({
    year: yearSchema,
    month: monthSchema,
    company_id: uuidSchema,
    companyId: uuidSchema.optional(),
    bmm: z.union([z.number(), z.string()]).default(0),
    revenue: z.union([z.number(), z.string()]).default(0),
    currency_id: optionalUuid,
    currencyId: optionalUuid,
    notes: optionalLongString,
  })
  .strict();

export const annualPlanBatchSchema = z.array(annualPlanBodySchema).max(5000);

export const annualPlanBulkUpsertSchema = z
  .array(
    annualPlanBodySchema.partial().extend({ id: uuidSchema.optional() }),
  )
  .max(5000);

// -----------------------------------------------------------------------------
// Bonus by company / by division
// -----------------------------------------------------------------------------
export const bonusByCBodySchema = z
  .object({
    year: yearSchema,
    company_id: uuidSchema.optional(),
    companyId: uuidSchema.optional(),
    bn_bmm: z.union([z.number(), z.string()]),
    bnBmm: z.union([z.number(), z.string()]).optional(),
    notes: optionalLongString,
  })
  .strict();

export const bonusByDBodySchema = z
  .object({
    year: yearSchema,
    division_id: uuidSchema.optional(),
    divisionId: uuidSchema.optional(),
    bn_bmm: z.union([z.number(), z.string()]),
    bnBmm: z.union([z.number(), z.string()]).optional(),
    notes: optionalLongString,
  })
  .strict();

// -----------------------------------------------------------------------------
// Costs
// -----------------------------------------------------------------------------
export const costBodySchema = z
  .object({
    year: yearSchema,
    month: monthSchema,
    cost: z.union([z.number(), z.string()]),
    cost_type: optionalUuid,
    costType: optionalUuid,
    company_id: optionalUuid,
    companyId: optionalUuid,
    division_id: optionalUuid,
    divisionId: optionalUuid,
    project_id: optionalUuid,
    projectId: optionalUuid,
    resource_id: optionalUuid,
    resourceId: optionalUuid,
    price: optionalNumericString,
    volume: optionalNumericString,
    is_checked: z.boolean().optional().nullable(),
    isChecked: z.boolean().optional().nullable(),
    is_cost: z.boolean().optional().nullable(),
    isCost: z.boolean().optional().nullable(),
    description: optionalLongString,
    notes: optionalLongString,
  })
  .strict();

export const costBatchSchema = z.array(costBodySchema).max(5000);

// -----------------------------------------------------------------------------
// Revenues
// -----------------------------------------------------------------------------
export const revenueBodySchema = z
  .object({
    year: yearSchema,
    month: monthSchema,
    project_name: z.string().trim().max(255).optional(),
    projectName: z.string().trim().max(255).optional(),
    original_amount: z.union([z.number(), z.string()]),
    originalAmount: z.union([z.number(), z.string()]).optional(),
    vnd_revenue: z.union([z.number(), z.string()]),
    vndRevenue: z.union([z.number(), z.string()]).optional(),
    quantity: optionalNumericString,
    unit_price: optionalNumericString,
    unitPrice: optionalNumericString,
    notes: optionalLongString,
    company_id: optionalUuid,
    companyId: optionalUuid,
    division_id: optionalUuid,
    divisionId: optionalUuid,
    customer_id: optionalUuid,
    customerId: optionalUuid,
    project_id: optionalUuid,
    projectId: optionalUuid,
    project_type_id: optionalUuid,
    projectTypeId: optionalUuid,
    resource_id: optionalUuid,
    resourceId: optionalUuid,
    currency_id: optionalUuid,
    currencyId: optionalUuid,
  })
  .strict();

export const revenueBatchSchema = z.array(revenueBodySchema).max(5000);

// -----------------------------------------------------------------------------
// Salary costs
// -----------------------------------------------------------------------------
export const salaryCostBodySchema = z
  .object({
    year: yearSchema,
    month: monthSchema,
    amount: z.union([z.number(), z.string()]),
    company_id: optionalUuid,
    companyId: optionalUuid,
    division_id: optionalUuid,
    divisionId: optionalUuid,
    customer_id: optionalUuid,
    customerId: optionalUuid,
    notes: optionalLongString,
  })
  .strict();

export const salaryCostBatchSchema = z.array(salaryCostBodySchema).max(5000);

// -----------------------------------------------------------------------------
// List filter shared helpers
// -----------------------------------------------------------------------------
export const listFilterSchema = z.object({
  year: yearSchema.optional(),
  months: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
        : [],
    ),
  q: z.string().trim().max(100).optional(),
  cost_type: uuidSchema.optional(),
  company_id: uuidSchema.optional(),
  division_id: uuidSchema.optional(),
  customer_id: uuidSchema.optional(),
  project_id: uuidSchema.optional(),
  project_type_id: uuidSchema.optional(),
  resource_id: uuidSchema.optional(),
  currency_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z
    .union([z.coerce.number().int().min(1).max(5000), z.literal("all")])
    .optional(),
});
