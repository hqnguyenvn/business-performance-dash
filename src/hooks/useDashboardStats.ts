
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStatsArgs {
  year: number;
  months: number[];
  incomeTaxRate: number;
  bonusRate: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  customerCount: number;
  loading: boolean;
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
  // We can't get customers info directly from stat cards, but for dashboard show count of unique revenue.customer_id

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // get all revenues and costs for the filter
      const [{ data: revenuesData }, { data: costsData }, { data: costTypesData }] =
        await Promise.all([
          supabase.from("revenues").select("*").in("year", [year]).in("month", months),
          supabase.from("costs").select("*").in("year", [year]).in("month", months),
          supabase.from("cost_types").select("id, code"),
        ]);
      setRevenues(revenuesData || []);
      setCosts(costsData || []);
      setCostTypes(costTypesData || []);
      setLoading(false);
    }
    fetchData();
  }, [year, months.join(","), incomeTaxRate, bonusRate]);

  const stats = useMemo(() => {
    if (loading) {
      return {
        totalRevenue: 0,
        totalCost: 0,
        netProfit: 0,
        customerCount: 0,
        loading: true,
      };
    }

    // Total Revenue (sum of vnd_revenue)
    const totalRevenue = revenues.reduce((sum, r) => sum + (r.vnd_revenue || 0), 0);

    // For cost and net profit: Get salary costTypeId
    const salaryType = costTypes.find((ct: any) => ct.code?.toLowerCase() === "salary");
    const salaryCostTypeId = salaryType?.id;

    // Calculate base cost as sum of all costs
    const baseCost = costs.reduce((sum, c) => sum + (c.cost || 0), 0);

    // Calculate bonus
    // For each month, for salary costs only
    let bonus = 0;
    months.forEach((m) => {
      const monthlySalary = costs
        .filter(
          (c) =>
            c.cost_type === salaryCostTypeId &&
            c.year === year &&
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
    for (const row of revenues) {
      if (row.customer_id) customerSet.add(row.customer_id);
    }
    const customerCount = customerSet.size;

    return {
      totalRevenue,
      totalCost,
      netProfit,
      customerCount,
      loading: false,
    };
  }, [revenues, costs, costTypes, loading, bonusRate, incomeTaxRate, months, year]);

  return stats;
}
