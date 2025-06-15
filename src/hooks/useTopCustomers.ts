
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  totalRevenue: number;
}

export function useTopCustomers(year: number, months: number[], topN: number = 5) {
  const [data, setData] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTopCustomers() {
      setLoading(true);
      // Query joined with customers table for names
      const { data: results, error } = await supabase
        .from("revenues")
        .select("customer_id, vnd_revenue, customers(name)")
        .eq("year", year)
        .in("month", months)
        .not("customer_id", "is", null);

      if (error) {
        setData([]);
        setLoading(false);
        return;
      }

      // Group and sum revenue by customer_id
      const revenueMap = new Map<string, { name: string; total: number }>();
      for (const row of results as any[]) {
        if (!row.customer_id) continue;
        const name = (row.customers?.name as string) || "Unknown";
        if (!revenueMap.has(row.customer_id)) {
          revenueMap.set(row.customer_id, { name, total: 0 });
        }
        revenueMap.get(row.customer_id)!.total += row.vnd_revenue || 0;
      }
      // Sort by totalRevenue desc
      const sorted = Array.from(revenueMap.entries())
        .map(([customer_id, v]) => ({
          customer_id,
          customer_name: v.name,
          totalRevenue: v.total,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, topN);

      setData(sorted);
      setLoading(false);
    }
    fetchTopCustomers();
  }, [year, months.join(","), topN]);

  return { data, loading };
}
