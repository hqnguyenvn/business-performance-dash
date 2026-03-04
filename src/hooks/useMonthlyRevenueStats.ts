
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyRevenueCostStat {
  month: number;
  totalRevenue: number;
  totalCost: number;
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function useMonthlyRevenueStats(year: number) {
  const [data, setData] = useState<MonthlyRevenueCostStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!hasFetched) setLoading(true);

      const [revResult, costResult] = await Promise.all([
        supabase.from("revenues").select("month, vnd_revenue").eq("year", year),
        supabase.from("costs").select("month, cost").eq("year", year),
      ]);

      if (revResult.error && costResult.error) {
        setData([]);
        setLoading(false);
        setHasFetched(true);
        return;
      }

      const revenueByMonth: Record<number, number> = {};
      const costByMonth: Record<number, number> = {};
      ALL_MONTHS.forEach((m) => {
        revenueByMonth[m] = 0;
        costByMonth[m] = 0;
      });

      (revResult.data || []).forEach((item) => {
        revenueByMonth[item.month] = (revenueByMonth[item.month] || 0) + (item.vnd_revenue || 0);
      });

      (costResult.data || []).forEach((item) => {
        costByMonth[item.month] = (costByMonth[item.month] || 0) + (item.cost || 0);
      });

      const chartData: MonthlyRevenueCostStat[] = ALL_MONTHS.map((month) => ({
        month,
        totalRevenue: revenueByMonth[month] || 0,
        totalCost: costByMonth[month] || 0,
      }));

      setData(chartData);
      setLoading(false);
      setHasFetched(true);
    }
    fetchData();
  }, [year]);

  return { data, loading };
}
