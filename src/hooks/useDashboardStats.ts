import { useQuery } from "@tanstack/react-query";
import {
  getDashboardPrimitives,
  type DashboardPeriodPrimitives,
} from "@/services/reportsService";

interface DashboardStatsArgs {
  year: number;
  months: number[];
  /** Income tax rate as a percentage (e.g. 5 for 5%). */
  incomeTaxRate: number;
  /** Bonus rate as a percentage (e.g. 15 for 15%). */
  bonusRate: number;
}

export interface StatWithChange {
  value: number;
  prevValue: number | null;
  percentChange: number | null;
  /** Planned value for the period (VND for revenue, raw number for BMM). null when no plan exists. */
  planValue?: number | null;
  /** ((value - planValue) / |planValue|) × 100 — null when no plan. */
  planPercent?: number | null;
}

export interface DashboardStats {
  totalRevenue: StatWithChange;
  totalCost: StatWithChange;
  grossProfit: StatWithChange;
  netProfit: StatWithChange;
  totalBMM: StatWithChange;
  customerCount: StatWithChange;
  devEE: StatWithChange;
  devEEBMM: number;
  devEECMM: number;
  ee: StatWithChange;
  eeBMM: number;
  eeCMM: number;
  overheadRatio: StatWithChange;
  loading: boolean;
}

/**
 * Computes the derived KPIs from a period's aggregated primitives.
 * Formula matches the legacy client-side implementation (see git history
 * prior to the Supabase→PG migration).
 */
function calcKPIs(
  period: DashboardPeriodPrimitives,
  incomeTaxRate: number,
  bonusRate: number,
) {
  const totalRevenue = period.total_revenue;
  const baseCost = period.total_cost;
  const salaryCost = period.salary_cost;
  const bonus = salaryCost * (bonusRate / 100);
  const grossProfit = totalRevenue - baseCost;
  const incomeTax = grossProfit > 0 ? grossProfit * (incomeTaxRate / 100) : 0;
  const totalCost = baseCost + bonus + incomeTax;
  const netProfit = totalRevenue - totalCost;

  const customerCount = period.customer_count;
  const totalBMM = period.total_bmm;
  const totalCMM = period.total_cmm;
  const devCMM = period.dev_cmm;
  const overheadRatio =
    period.total_cwd > 0 ? period.overhead_cwd / period.total_cwd : 0;

  const ee = totalCMM > 0 ? totalBMM / totalCMM : 0;
  const devEE = devCMM > 0 ? totalBMM / devCMM : 0;

  const planRevenue = period.plan_revenue ?? 0;
  const planBmm = period.plan_bmm ?? 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    netProfit,
    customerCount,
    ee,
    devEE,
    totalBMM,
    totalCMM,
    devCMM,
    overheadRatio,
    planRevenue,
    planBmm,
  };
}

function percentChange(current: number, prev: number | null): number | null {
  if (prev === null || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

function planFields(value: number, planValue: number) {
  if (planValue === 0) {
    return { planValue: null, planPercent: null };
  }
  return {
    planValue,
    planPercent: ((value - planValue) / Math.abs(planValue)) * 100,
  };
}

const ZERO_STATS: DashboardStats = {
  totalRevenue: { value: 0, prevValue: null, percentChange: null },
  totalCost: { value: 0, prevValue: null, percentChange: null },
  grossProfit: { value: 0, prevValue: null, percentChange: null },
  netProfit: { value: 0, prevValue: null, percentChange: null },
  totalBMM: { value: 0, prevValue: null, percentChange: null },
  customerCount: { value: 0, prevValue: null, percentChange: null },
  devEE: { value: 0, prevValue: null, percentChange: null },
  devEEBMM: 0,
  devEECMM: 0,
  ee: { value: 0, prevValue: null, percentChange: null },
  eeBMM: 0,
  eeCMM: 0,
  overheadRatio: { value: 0, prevValue: null, percentChange: null },
  loading: true,
};

export function useDashboardStats({
  year,
  months,
  incomeTaxRate,
  bonusRate,
}: DashboardStatsArgs): DashboardStats {
  const monthsKey = [...months].sort((a, b) => a - b).join(",");

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["dashboard-primitives", year, monthsKey],
    queryFn: () => getDashboardPrimitives(year, months),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: months.length > 0,
  });

  if (isLoading || !data) {
    return ZERO_STATS;
  }

  const now = calcKPIs(data.current, incomeTaxRate, bonusRate);
  const hasPrev =
    data.previous.total_revenue > 0 ||
    data.previous.total_cost > 0 ||
    data.previous.customer_count > 0;
  const prev = hasPrev
    ? calcKPIs(data.previous, incomeTaxRate, bonusRate)
    : null;

  return {
    totalRevenue: {
      value: now.totalRevenue,
      prevValue: prev?.totalRevenue ?? null,
      percentChange: percentChange(now.totalRevenue, prev?.totalRevenue ?? null),
      ...planFields(now.totalRevenue, now.planRevenue),
    },
    totalCost: {
      value: now.totalCost,
      prevValue: prev?.totalCost ?? null,
      percentChange: percentChange(now.totalCost, prev?.totalCost ?? null),
    },
    grossProfit: {
      value: now.grossProfit,
      prevValue: prev?.grossProfit ?? null,
      percentChange: percentChange(now.grossProfit, prev?.grossProfit ?? null),
    },
    netProfit: {
      value: now.netProfit,
      prevValue: prev?.netProfit ?? null,
      percentChange: percentChange(now.netProfit, prev?.netProfit ?? null),
    },
    totalBMM: {
      value: now.totalBMM,
      prevValue: prev?.totalBMM ?? null,
      percentChange: percentChange(now.totalBMM, prev?.totalBMM ?? null),
      ...planFields(now.totalBMM, now.planBmm),
    },
    customerCount: {
      value: now.customerCount,
      prevValue: prev?.customerCount ?? null,
      percentChange: percentChange(
        now.customerCount,
        prev?.customerCount ?? null,
      ),
    },
    devEE: {
      value: now.devEE,
      prevValue: prev?.devEE ?? null,
      percentChange: percentChange(now.devEE, prev?.devEE ?? null),
    },
    devEEBMM: now.totalBMM,
    devEECMM: now.devCMM,
    ee: {
      value: now.ee,
      prevValue: prev?.ee ?? null,
      percentChange: percentChange(now.ee, prev?.ee ?? null),
    },
    eeBMM: now.totalBMM,
    eeCMM: now.totalCMM,
    overheadRatio: {
      value: now.overheadRatio,
      prevValue: prev?.overheadRatio ?? null,
      percentChange: percentChange(
        now.overheadRatio,
        prev?.overheadRatio ?? null,
      ),
    },
    loading: !isSuccess,
  };
}
