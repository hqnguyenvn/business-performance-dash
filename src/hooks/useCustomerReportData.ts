import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCustomerSummary,
  type CustomerSummaryResponse,
} from "@/services/reportsService";
import { useParameterValues } from "@/hooks/useParameterValues";

export interface GroupedCustomerData {
  year: number;
  month: number;
  customer_id: string;
  customer_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number;
}

interface Args {
  selectedYear: string;
  selectedMonths: number[];
}

/**
 * Per-customer KPIs. Applies the legacy formula using the primitives
 * returned by `/api/reports/customer-summary`:
 *   overhead = (totalCost + tax - customerSalaryFromSalaryCosts) / totalBMM
 *   avgBonus = (salaryCostFromCosts × bonusRate) / totalBMM
 *   customerRow = { bmm, revenue, salary, overhead × bmm, avgBonus × bmm }
 */
function buildGrouped(
  data: CustomerSummaryResponse,
  taxRate: number,
  bonusRate: number,
): GroupedCustomerData[] {
  const pKey = (y: number, m: number) => `${y}_${m}`;
  const gKey = (y: number, m: number, id: string) => `${y}_${m}_${id}`;

  const revenueByPeriod = new Map<string, number>();
  const bmmByPeriod = new Map<string, number>();
  for (const t of data.revenue_totals) {
    revenueByPeriod.set(pKey(t.year, t.month), t.total_revenue);
    bmmByPeriod.set(pKey(t.year, t.month), t.total_bmm);
  }
  const costByPeriod = new Map<string, number>();
  const salaryCostFromCostsByPeriod = new Map<string, number>();
  for (const t of data.month_totals) {
    costByPeriod.set(pKey(t.year, t.month), t.total_cost);
    salaryCostFromCostsByPeriod.set(
      pKey(t.year, t.month),
      t.salary_cost_from_costs,
    );
  }
  // Customer salary by period (which customers had revenue that period)
  const customersWithRevenueByPeriod = new Map<string, Set<string>>();
  for (const g of data.groups) {
    if (!g.customer_id) continue;
    const k = pKey(g.year, g.month);
    if (!customersWithRevenueByPeriod.has(k)) {
      customersWithRevenueByPeriod.set(k, new Set());
    }
    customersWithRevenueByPeriod.get(k)!.add(g.customer_id);
  }
  // salary cost summed for only those customers with revenue (legacy behaviour)
  const customerCostByPeriod = new Map<string, number>();
  for (const r of data.customer_salary) {
    if (!r.customer_id) continue;
    const k = pKey(r.year, r.month);
    const set = customersWithRevenueByPeriod.get(k);
    if (set?.has(r.customer_id)) {
      customerCostByPeriod.set(
        k,
        (customerCostByPeriod.get(k) ?? 0) + r.salary_cost,
      );
    }
  }
  const salaryByCustomerKey = new Map<string, number>();
  for (const r of data.customer_salary) {
    if (!r.customer_id) continue;
    salaryByCustomerKey.set(
      gKey(r.year, r.month, r.customer_id),
      r.salary_cost,
    );
  }

  // Overhead per BMM (customer formula differs from company — legacy parity)
  const overheadPerBmmByPeriod = new Map<string, number>();
  for (const [k, totalCostFromCosts] of costByPeriod.entries()) {
    const customerCost = customerCostByPeriod.get(k) ?? 0;
    const totalRevenue = revenueByPeriod.get(k) ?? 0;
    const totalBmm = bmmByPeriod.get(k) ?? 0;
    const tax = taxRate * (totalRevenue - totalCostFromCosts);
    overheadPerBmmByPeriod.set(
      k,
      totalBmm !== 0 ? (totalCostFromCosts + tax - customerCost) / totalBmm : 0,
    );
  }

  // Average bonus per BMM
  const avgBonusPerBmmByPeriod = new Map<string, number>();
  for (const [k] of bmmByPeriod.entries()) {
    const salaryCostFromCosts = salaryCostFromCostsByPeriod.get(k) ?? 0;
    const totalBmm = bmmByPeriod.get(k) ?? 0;
    avgBonusPerBmmByPeriod.set(
      k,
      totalBmm !== 0 ? (salaryCostFromCosts * bonusRate) / totalBmm : 0,
    );
  }

  const out: GroupedCustomerData[] = [];
  for (const g of data.groups) {
    if (!g.customer_id) continue;
    const k = pKey(g.year, g.month);
    const overheadPerBmm = overheadPerBmmByPeriod.get(k) ?? 0;
    const avgBonus = avgBonusPerBmmByPeriod.get(k) ?? 0;
    const salaryCost =
      salaryByCustomerKey.get(gKey(g.year, g.month, g.customer_id)) ?? 0;

    out.push({
      year: g.year,
      month: g.month,
      customer_id: g.customer_id,
      customer_code: g.customer_code,
      bmm: g.total_bmm,
      revenue: g.total_revenue,
      salaryCost,
      overheadCost: overheadPerBmm * g.total_bmm,
      bonusValue: avgBonus * g.total_bmm,
    });
  }
  out.sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.customer_code.localeCompare(b.customer_code);
  });
  return out;
}

export function useCustomerReportData({ selectedYear, selectedMonths }: Args) {
  const year = parseInt(selectedYear, 10);
  const { taxRate, bonusRate, ready: paramsReady } = useParameterValues(year);
  const monthsKey = [...selectedMonths].sort((a, b) => a - b).join(",");

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["customer-summary", year, monthsKey],
    queryFn: () => getCustomerSummary(year, selectedMonths),
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
    return buildGrouped(data, taxRate, bonusRate);
  }, [data, taxRate, bonusRate]);

  return {
    groupedData,
    loading: isLoading || isFetching || !paramsReady,
    error: error?.message ?? null,
  };
}
