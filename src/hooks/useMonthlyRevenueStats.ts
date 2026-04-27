import { useQuery } from "@tanstack/react-query";
import { getMonthlySummary } from "@/services/reportsService";
import { MONTHS as MONTHS_FULL } from "@/lib/months";

interface MonthlyRevenueCostStat {
  month: number;
  totalRevenue: number;
  totalCost: number;
}

const ALL_MONTHS = MONTHS_FULL.map((m) => m.value);

export function useMonthlyRevenueStats(year: number) {
  const { data = [], isLoading: loading } = useQuery<MonthlyRevenueCostStat[]>({
    queryKey: ["monthly-revenue-stats", year],
    queryFn: async () => {
      const rows = await getMonthlySummary(year, ALL_MONTHS);
      const map = new Map<number, { totalRevenue: number; totalCost: number }>();
      for (const r of rows) {
        map.set(r.month, {
          totalRevenue: r.total_revenue,
          totalCost: r.total_cost,
        });
      }
      return ALL_MONTHS.map((month) => ({
        month,
        totalRevenue: map.get(month)?.totalRevenue ?? 0,
        totalCost: map.get(month)?.totalCost ?? 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { data, loading };
}
