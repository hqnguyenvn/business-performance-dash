
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

      // 1. Lấy dữ liệu revenues đã lọc
      const { data: revenues, error } = await supabase
        .from("revenues")
        .select("customer_id, vnd_revenue")
        .eq("year", year)
        .in("month", months)
        .not("customer_id", "is", null);

      if (error || !revenues) {
        setData([]);
        setLoading(false);
        return;
      }

      // 2. Tính tổng revenue theo customer_id
      const revenueMap = new Map<string, number>();
      for (const row of revenues) {
        if (!row.customer_id) continue;
        const prev = revenueMap.get(row.customer_id) || 0;
        revenueMap.set(row.customer_id, prev + (row.vnd_revenue || 0));
      }

      const topCustomerIds = Array.from(revenueMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([customer_id]) => customer_id);

      // 3. Lấy tên khách hàng cho các customer_id này (nếu có dữ liệu!)
      let nameMap: Record<string, string> = {};
      if (topCustomerIds.length) {
        const { data: customers } = await supabase
          .from("customers")
          .select("id,name")
          .in("id", topCustomerIds);
        if (customers) {
          for (const c of customers) {
            nameMap[c.id] = c.name;
          }
        }
      }

      // 4. Tạo mảng kết quả gồm {customer_id, customer_name, totalRevenue}
      const result: TopCustomer[] = Array.from(revenueMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([customer_id, total]) => ({
          customer_id,
          customer_name: nameMap[customer_id] || customer_id,
          totalRevenue: total,
        }));

      setData(result);
      setLoading(false);
    }
    fetchTopCustomers();
  }, [year, months.join(","), topN]);

  return { data, loading };
}
