/**
 * Client for the server-side aggregate report endpoints.
 *
 * The server does the SQL GROUP BY; these helpers hand the pre-aggregated
 * primitives back to the calling hook, which applies the business formula
 * (tax, bonus, gross/net profit, overhead per BMM).
 */
import { api } from "@/lib/api";

// -----------------------------------------------------------------------------
// monthly-summary
// -----------------------------------------------------------------------------
export interface MonthlySummaryRow {
  month: number;
  total_revenue: number;
  total_cost: number;
  total_bmm: number;
  customer_count: number;
  salary_cost: number;
}

export function getMonthlySummary(year: number, months?: number[]) {
  return api.get<MonthlySummaryRow[]>("/reports/monthly-summary", {
    year,
    months: months && months.length > 0 ? months.join(",") : undefined,
  });
}

// -----------------------------------------------------------------------------
// dashboard
// -----------------------------------------------------------------------------
export interface DashboardPeriodPrimitives {
  total_revenue: number;
  total_cost: number;
  salary_cost: number;
  total_bmm: number;
  customer_count: number;
  total_cwd: number;
  overhead_cwd: number;
  total_cmm: number;
  dev_cmm: number;
  /** SUM(annual_plans.revenue × exchange_rate) for the period — VND. */
  plan_revenue: number;
  /** SUM(annual_plans.bmm) for the period. */
  plan_bmm: number;
}

export interface DashboardPrimitives {
  current: DashboardPeriodPrimitives;
  previous: DashboardPeriodPrimitives;
}

export function getDashboardPrimitives(year: number, months: number[]) {
  return api.get<DashboardPrimitives>("/reports/dashboard", {
    year,
    months: months.join(","),
  });
}

// -----------------------------------------------------------------------------
// top-customers
// -----------------------------------------------------------------------------
export interface TopCustomerRow {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  total_revenue: number;
}

export function getTopCustomers(
  year: number,
  months: number[],
  limit: number = 10,
) {
  return api.get<TopCustomerRow[]>("/reports/top-customers", {
    year,
    months: months.join(","),
    limit,
  });
}

// -----------------------------------------------------------------------------
// business-summary
// -----------------------------------------------------------------------------
export interface BusinessSummaryRow {
  year: number;
  month: number;
  total_revenue: number;
  total_cost: number;
  salary_cost: number;
}

export function getBusinessSummary(year: number) {
  return api.get<BusinessSummaryRow[]>("/reports/business-summary", { year });
}

// -----------------------------------------------------------------------------
// company-summary
// -----------------------------------------------------------------------------
export interface CompanyGroupRow {
  year: number;
  month: number;
  company_id: string | null;
  company_code: string;
  total_bmm: number;
  total_revenue: number;
}

export interface PeriodCompanySalaryRow {
  year: number;
  month: number;
  company_id: string | null;
  salary_cost: number;
}

export interface MonthTotalRow {
  year: number;
  month: number;
  total_cost: number;
  salary_cost_from_costs: number;
}

export interface PeriodRevenueTotalRow {
  year: number;
  month: number;
  total_revenue: number;
  total_bmm: number;
}

export interface PeriodSalaryTotalRow {
  year: number;
  month: number;
  total_salary: number;
}

export interface BonusByCompanyRow {
  company_id: string;
  bn_bmm: number;
}

export interface CompanySummaryResponse {
  groups: CompanyGroupRow[];
  company_salary: PeriodCompanySalaryRow[];
  month_totals: MonthTotalRow[];
  revenue_totals: PeriodRevenueTotalRow[];
  salary_totals: PeriodSalaryTotalRow[];
  bonus_by_company: BonusByCompanyRow[];
}

export function getCompanySummary(year: number, months: number[]) {
  return api.get<CompanySummaryResponse>("/reports/company-summary", {
    year,
    months: months.join(","),
  });
}

// -----------------------------------------------------------------------------
// division-summary
// -----------------------------------------------------------------------------
export interface DivisionGroupRow {
  year: number;
  month: number;
  division_id: string | null;
  division_code: string;
  total_bmm: number;
  total_revenue: number;
}

export interface PeriodDivisionSalaryRow {
  year: number;
  month: number;
  division_id: string | null;
  salary_cost: number;
}

export interface BonusByDivisionRow {
  division_id: string;
  bn_bmm: number;
}

export interface DivisionSummaryResponse {
  groups: DivisionGroupRow[];
  division_salary: PeriodDivisionSalaryRow[];
  month_totals: MonthTotalRow[];
  revenue_totals: PeriodRevenueTotalRow[];
  salary_totals: PeriodSalaryTotalRow[];
  bonus_by_division: BonusByDivisionRow[];
}

export function getDivisionSummary(year: number, months: number[]) {
  return api.get<DivisionSummaryResponse>("/reports/division-summary", {
    year,
    months: months.join(","),
  });
}

// -----------------------------------------------------------------------------
// customer-summary
// -----------------------------------------------------------------------------
export interface CustomerGroupRow {
  year: number;
  month: number;
  customer_id: string | null;
  customer_code: string;
  total_bmm: number;
  total_revenue: number;
}

export interface PeriodCustomerSalaryRow {
  year: number;
  month: number;
  customer_id: string | null;
  salary_cost: number;
}

export interface CompanyBmmRow {
  year: number;
  month: number;
  company_id: string | null;
  total_bmm: number;
}

export interface CustomerSummaryResponse {
  groups: CustomerGroupRow[];
  customer_salary: PeriodCustomerSalaryRow[];
  month_totals: MonthTotalRow[];
  revenue_totals: PeriodRevenueTotalRow[];
  bonus_by_company: BonusByCompanyRow[];
  company_bmm: CompanyBmmRow[];
}

export function getCustomerSummary(year: number, months: number[]) {
  return api.get<CustomerSummaryResponse>("/reports/customer-summary", {
    year,
    months: months.join(","),
  });
}

// -----------------------------------------------------------------------------
// plan-vs-actual
// -----------------------------------------------------------------------------
export interface PlanVsActualRow {
  month: number;
  plan_revenue: number;
  actual_revenue: number;
  plan_bmm: number;
  actual_bmm: number;
}

export function getPlanVsActual(year: number) {
  return api.get<PlanVsActualRow[]>("/reports/plan-vs-actual", { year });
}

// -----------------------------------------------------------------------------
// available-years
// -----------------------------------------------------------------------------
export function getAvailableYears() {
  return api.get<number[]>("/reports/available-years");
}
