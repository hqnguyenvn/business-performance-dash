
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyRevenueStat {
  month: number;
  totalRevenue: number;
}

export function useMonthlyRevenueStats(year: number, months: number[]) {
  const [data, setData] = useState<MonthlyRevenueStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMonthlyRevenues() {
      setLoading(true);
      // Query: Lấy revenue của các tháng trong năm được chọn
      const { data: revenues, error } = await supabase
        .from("revenues")
        .select("month, vnd_revenue")
        .eq("year", year)
        .in("month", months);

      if (error) {
        setData([]);
        setLoading(false);
        return;
      }
      // Tính tổng revenue theo từng tháng
      const revenueByMonth: Record<number, number> = {};
      months.forEach((m) => (revenueByMonth[m] = 0));
      (revenues || []).forEach((item) => {
        const month = item.month;
        const value = item.vnd_revenue || 0;
        revenueByMonth[month] = (revenueByMonth[month] || 0) + value;
      });
      // Chuyển thành array
      const chartData: MonthlyRevenueStat[] = months.map((month) => ({
        month,
        totalRevenue: revenueByMonth[month] || 0,
      }));
      setData(chartData);
      setLoading(false);
    }
    fetchMonthlyRevenues();
  }, [year, months.join(",")]);

  return { data, loading };
}
