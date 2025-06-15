
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStatsArgs {
  year: number;
  months: number[];
  incomeTaxRate: number;
  bonusRate: number;
}
export interface StatWithChange {
  value: number;
  prevValue: number | null; // null nghĩa là không có dữ liệu tháng trước
  percentChange: number | null; // null = không có so sánh
}
export interface DashboardStats {
  totalRevenue: StatWithChange;
  totalCost: StatWithChange;
  netProfit: StatWithChange;
  customerCount: StatWithChange;
  loading: boolean;
}

function getPreviousMonth(year: number, months: number[]): { prevYear: number, prevMonth: number } | null {
  if (months.length === 0) return null;
  // Lấy tháng nhỏ nhất -1
  const minMonth = Math.min(...months);
  if (minMonth === 1) { // Nếu tháng 1, quay về tháng 12 năm trước
    return { prevYear: year - 1, prevMonth: 12 };
  }
  return { prevYear: year, prevMonth: minMonth - 1 };
}

export function useDashboardStats({
  year,
  months,
  incomeTaxRate,
  bonusRate,
}: DashboardStatsArgs): DashboardStats {
  const [loading, setLoading] = useState(true);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [costTypes, setCostTypes] = useState<any[]>([]);
  const [prevRevenues, setPrevRevenues] = useState<any[]>([]);
  const [prevCosts, setPrevCosts] = useState<any[]>([]);
  // We can't get customers info directly from stat cards, but for dashboard show count of unique revenue.customer_id

  // Tìm tháng trước để so sánh
  const prevMonthInfo = useMemo(() => getPreviousMonth(year, months), [year, months]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // get all revenues and costs for the filter
      const queries = [
        supabase.from("revenues").select("*").in("year", [year]).in("month", months),
        supabase.from("costs").select("*").in("year", [year]).in("month", months),
        supabase.from("cost_types").select("id, code"),
      ];
      // Thêm truy vấn tháng trước nếu có
      if (prevMonthInfo) {
        queries.push(
          supabase.from("revenues").select("*").eq("year", prevMonthInfo.prevYear).eq("month", prevMonthInfo.prevMonth),
          supabase.from("costs").select("*").eq("year", prevMonthInfo.prevYear).eq("month", prevMonthInfo.prevMonth)
        );
      }

      const results = await Promise.all(queries);

      setRevenues(results[0]?.data || []);
      setCosts(results[1]?.data || []);
      setCostTypes(results[2]?.data || []);
      if (prevMonthInfo) {
        setPrevRevenues(results[3]?.data || []);
        setPrevCosts(results[4]?.data || []);
      } else {
        setPrevRevenues([]);
        setPrevCosts([]);
      }
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line
  }, [year, months.join(","), incomeTaxRate, bonusRate]);

  function calcStats(revenuesArr: any[], costsArr: any[], costTypesArr: any[]): {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    customerCount: number;
  } {
    // Total Revenue (sum of vnd_revenue)
    const totalRevenue = revenuesArr.reduce((sum, r) => sum + (r.vnd_revenue || 0), 0);

    // For cost and net profit: Get salary costTypeId
    const salaryType = costTypesArr.find((ct: any) => ct.code?.toLowerCase() === "salary");
    const salaryCostTypeId = salaryType?.id;

    // Calculate base cost as sum of all costs
    const baseCost = costsArr.reduce((sum, c) => sum + (c.cost || 0), 0);

    // Calculate bonus (for each relevant month, for salary costs only)
    let bonus = 0;
    // Lấy danh sách tháng trong dữ liệu
    const monthsArr = Array.from(new Set(costsArr.map(c => c.month)));
    monthsArr.forEach((m) => {
      const monthlySalary = costsArr
        .filter(
          (c) =>
            c.cost_type === salaryCostTypeId &&
            c.year !== undefined && // Có thể khi filter tháng trước sẽ thiếu thuộc tính này
            c.month === m
        )
        .reduce((sum, c) => sum + (c.cost || 0), 0);
      bonus += monthlySalary * (bonusRate / 100);
    });
    // Calculate gross profit
    const grossProfit = totalRevenue - baseCost;
    // Income tax applies only if gross profit > 0
    const incomeTax = grossProfit > 0 ? grossProfit * (incomeTaxRate / 100) : 0;
    const totalCost = baseCost + bonus + incomeTax;
    const netProfit = totalRevenue - totalCost;

    // Customers = count of unique customer_id in revenue (non-null)
    const customerSet = new Set<string>();
    for (const row of revenuesArr) {
      if (row.customer_id) customerSet.add(row.customer_id);
    }
    const customerCount = customerSet.size;

    return { totalRevenue, totalCost, netProfit, customerCount };
  }

  const stats = useMemo(() => {
    if (loading) {
      return {
        totalRevenue: { value: 0, prevValue: null, percentChange: null },
        totalCost: { value: 0, prevValue: null, percentChange: null },
        netProfit: { value: 0, prevValue: null, percentChange: null },
        customerCount: { value: 0, prevValue: null, percentChange: null },
        loading: true,
      };
    }

    const nowStats = calcStats(revenues, costs, costTypes);
    const prevStats = prevMonthInfo && prevRevenues.length + prevCosts.length > 0
      ? calcStats(prevRevenues, prevCosts, costTypes)
      : null;

    function percentChange(current: number, prev: number | null): number | null {
      if (prev === null || prev === 0) return null; // Không hiển thị nếu không so sánh được hoặc chia cho 0
      return ((current - prev) / Math.abs(prev)) * 100;
    }

    return {
      totalRevenue: {
        value: nowStats.totalRevenue,
        prevValue: prevStats ? prevStats.totalRevenue : null,
        percentChange: percentChange(nowStats.totalRevenue, prevStats ? prevStats.totalRevenue : null),
      },
      totalCost: {
        value: nowStats.totalCost,
        prevValue: prevStats ? prevStats.totalCost : null,
        percentChange: percentChange(nowStats.totalCost, prevStats ? prevStats.totalCost : null),
      },
      netProfit: {
        value: nowStats.netProfit,
        prevValue: prevStats ? prevStats.netProfit : null,
        percentChange: percentChange(nowStats.netProfit, prevStats ? prevStats.netProfit : null),
      },
      customerCount: {
        value: nowStats.customerCount,
        prevValue: prevStats ? prevStats.customerCount : null,
        percentChange: percentChange(nowStats.customerCount, prevStats ? prevStats.customerCount : null),
      },
      loading: false,
    };
  }, [
    revenues, costs, costTypes, loading,
    bonusRate, incomeTaxRate, months, year,
    prevMonthInfo, prevRevenues, prevCosts,
  ]);

  return stats;
}

