
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyRevenueStat {
  month: number;
  totalRevenue: number;
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function useMonthlyRevenueStats(year: number) {
  const [data, setData] = useState<MonthlyRevenueStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    async function fetchMonthlyRevenues() {
      if (!hasFetched) setLoading(true);
      const { data: revenues, error } = await supabase
        .from("revenues")
        .select("month, vnd_revenue")
        .eq("year", year);

      if (error) {
        setData([]);
        setLoading(false);
        setHasFetched(true);
        return;
      }
      const revenueByMonth: Record<number, number> = {};
      ALL_MONTHS.forEach((m) => (revenueByMonth[m] = 0));
      (revenues || []).forEach((item) => {
        const month = item.month;
        const value = item.vnd_revenue || 0;
        revenueByMonth[month] = (revenueByMonth[month] || 0) + value;
      });
      const chartData: MonthlyRevenueStat[] = ALL_MONTHS.map((month) => ({
        month,
        totalRevenue: revenueByMonth[month] || 0,
      }));
      setData(chartData);
      setLoading(false);
      setHasFetched(true);
    }
    fetchMonthlyRevenues();
  }, [year]);

  return { data, loading };
}
