import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getDivisionSummary,
  type DivisionSummaryResponse,
} from "@/services/reportsService";
import { useParameterValues } from "./useParameterValues";
import type {
  GroupedDivisionData,
  UseDivisionReportDataProps,
} from "./division-report/types";

export { MONTHS, YEARS } from "@/lib/months";
export type { GroupedDivisionData };

function buildGrouped(
  data: DivisionSummaryResponse,
  taxRate: number,
  bonusRate: number,
): GroupedDivisionData[] {
  const periodKey = (year: number, month: number) => `${year}_${month}`;
  const groupKey = (year: number, month: number, divisionId: string) =>
    `${year}_${month}_${divisionId}`;

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
  const divisionSalary = new Map<string, number>();
  for (const r of data.division_salary) {
    if (!r.division_id) continue;
    divisionSalary.set(groupKey(r.year, r.month, r.division_id), r.salary_cost);
  }
  const bonusMap = new Map<string, number>();
  for (const b of data.bonus_by_division) bonusMap.set(b.division_id, b.bn_bmm);

  const salaryBonusByPeriod = new Map<string, number>();
  for (const g of data.groups) {
    if (!g.division_id) continue;
    const bn = bonusMap.get(g.division_id) ?? 0;
    const pKey = periodKey(g.year, g.month);
    salaryBonusByPeriod.set(
      pKey,
      (salaryBonusByPeriod.get(pKey) ?? 0) + g.total_bmm * bn,
    );
  }

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

  const out: GroupedDivisionData[] = [];
  for (const g of data.groups) {
    if (!g.division_id) continue;
    const pKey = periodKey(g.year, g.month);
    const overheadPerBmm = overheadPerBmmByPeriod.get(pKey) ?? 0;
    const bn = bonusMap.get(g.division_id) ?? 0;
    const salaryCost =
      divisionSalary.get(groupKey(g.year, g.month, g.division_id)) ?? 0;

    out.push({
      year: g.year,
      month: g.month,
      division_id: g.division_id,
      division_code: g.division_code,
      bmm: g.total_bmm,
      revenue: g.total_revenue,
      salaryCost,
      overheadCost: overheadPerBmm * g.total_bmm,
      bonusValue: g.total_bmm * bn,
    });
  }
  out.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.division_code.localeCompare(b.division_code);
  });
  return out;
}

export const useDivisionReportData = ({
  selectedYear,
  selectedMonths,
}: UseDivisionReportDataProps) => {
  const year = parseInt(selectedYear, 10);
  const { taxRate, bonusRate, ready: paramsReady } = useParameterValues(year);

  const monthsKey = [...selectedMonths].sort((a, b) => a - b).join(",");

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["division-summary", year, monthsKey],
    queryFn: () => getDivisionSummary(year, selectedMonths),
    enabled:
      paramsReady &&
      Number.isFinite(year) &&
      selectedMonths.length > 0 &&
      taxRate !== null &&
      bonusRate !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const groupedData = useMemo(() => {
    if (!data || taxRate === null || bonusRate === null) return [];
    return buildGrouped(data, taxRate, bonusRate);
  }, [data, taxRate, bonusRate]);

  return {
    groupedData,
    loading: isLoading || isFetching || !paramsReady,
    error: error?.message || null,
  };
};
