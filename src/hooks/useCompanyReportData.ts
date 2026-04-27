import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParameterValues } from "@/hooks/useParameterValues";
import {
  getCompanySummary,
  type CompanySummaryResponse,
} from "@/services/reportsService";

export { MONTHS, YEARS } from "@/lib/months";

export type GroupedCompanyData = {
  year: number;
  month: number;
  company_id: string;
  company_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number;
};

interface UseCompanyReportDataProps {
  selectedYear: string;
  selectedMonths: number[];
}

/**
 * Aggregates per (year, month, company) KPIs from the server-side
 * `/api/reports/company-summary` primitives.
 *
 * Replaces the legacy client-side reducer that downloaded the entire
 * revenues/costs/salary_costs tables and grouped in JS.
 */
function buildGroupedData(
  data: CompanySummaryResponse,
  taxRate: number,
  bonusRate: number,
): GroupedCompanyData[] {
  const periodKey = (year: number, month: number) => `${year}_${month}`;
  const groupKey = (year: number, month: number, companyId: string) =>
    `${year}_${month}_${companyId}`;

  // Build lookup maps
  const revenueTotalByPeriod = new Map<string, number>();
  const bmmTotalByPeriod = new Map<string, number>();
  for (const t of data.revenue_totals) {
    revenueTotalByPeriod.set(periodKey(t.year, t.month), t.total_revenue);
    bmmTotalByPeriod.set(periodKey(t.year, t.month), t.total_bmm);
  }
  const totalCostByPeriod = new Map<string, number>();
  const salaryCostByPeriod = new Map<string, number>();
  for (const t of data.month_totals) {
    totalCostByPeriod.set(periodKey(t.year, t.month), t.total_cost);
    salaryCostByPeriod.set(
      periodKey(t.year, t.month),
      t.salary_cost_from_costs,
    );
  }
  const totalSalaryByPeriod = new Map<string, number>();
  for (const t of data.salary_totals) {
    totalSalaryByPeriod.set(periodKey(t.year, t.month), t.total_salary);
  }
  const companySalary = new Map<string, number>();
  for (const r of data.company_salary) {
    if (!r.company_id) continue;
    companySalary.set(groupKey(r.year, r.month, r.company_id), r.salary_cost);
  }
  const bonusMap = new Map<string, number>();
  for (const b of data.bonus_by_company) bonusMap.set(b.company_id, b.bn_bmm);

  // salaryBonus per period: Σ (companyBMM × bn_bmm) across all companies
  const salaryBonusByPeriod = new Map<string, number>();
  for (const g of data.groups) {
    if (!g.company_id) continue;
    const bn = bonusMap.get(g.company_id) ?? 0;
    const pKey = periodKey(g.year, g.month);
    salaryBonusByPeriod.set(
      pKey,
      (salaryBonusByPeriod.get(pKey) ?? 0) + g.total_bmm * bn,
    );
  }

  // overhead per BMM per period
  const overheadPerBmmByPeriod = new Map<string, number>();
  for (const [pKey, totalCostFromCosts] of totalCostByPeriod.entries()) {
    const salaryCostFromCosts = salaryCostByPeriod.get(pKey) ?? 0;
    const totalBmm = bmmTotalByPeriod.get(pKey) ?? 0;
    const salaryBonus = salaryBonusByPeriod.get(pKey) ?? 0;
    const totalRevenue = revenueTotalByPeriod.get(pKey) ?? 0;
    const totalSalary = totalSalaryByPeriod.get(pKey) ?? 0;

    const bonusCost = salaryCostFromCosts * bonusRate;
    const profitBeforeTax = totalRevenue - totalCostFromCosts;
    const taxCost = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;
    const totalOverhead =
      totalCostFromCosts + bonusCost + taxCost - salaryBonus - totalSalary;

    overheadPerBmmByPeriod.set(
      pKey,
      totalBmm !== 0 ? totalOverhead / totalBmm : 0,
    );
  }

  const out: GroupedCompanyData[] = [];
  for (const g of data.groups) {
    if (!g.company_id) continue;
    const pKey = periodKey(g.year, g.month);
    const overheadPerBmm = overheadPerBmmByPeriod.get(pKey) ?? 0;
    const bn = bonusMap.get(g.company_id) ?? 0;
    const salaryCost =
      companySalary.get(groupKey(g.year, g.month, g.company_id)) ?? 0;

    out.push({
      year: g.year,
      month: g.month,
      company_id: g.company_id,
      company_code: g.company_code,
      bmm: g.total_bmm,
      revenue: g.total_revenue,
      salaryCost,
      overheadCost: overheadPerBmm * g.total_bmm,
      bonusValue: g.total_bmm * bn,
    });
  }
  out.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.company_code.localeCompare(b.company_code);
  });
  return out;
}

export function useCompanyReportData({
  selectedYear,
  selectedMonths,
}: UseCompanyReportDataProps) {
  const year = parseInt(selectedYear, 10);
  const { taxRate, bonusRate, ready: paramsReady } = useParameterValues(year);

  const monthsKey = [...selectedMonths].sort((a, b) => a - b).join(",");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["company-summary", year, monthsKey],
    queryFn: () => getCompanySummary(year, selectedMonths),
    enabled:
      paramsReady &&
      Number.isFinite(year) &&
      selectedMonths.length > 0 &&
      taxRate !== null &&
      bonusRate !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const groupedData = useMemo(() => {
    if (!data || taxRate === null || bonusRate === null) return [];
    return buildGroupedData(data, taxRate, bonusRate);
  }, [data, taxRate, bonusRate]);

  return {
    groupedData,
    loading: isLoading || isFetching || !paramsReady,
  };
}
