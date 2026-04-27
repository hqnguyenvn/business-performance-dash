import { useQuery } from "@tanstack/react-query";
import { getTopCustomers } from "@/services/reportsService";

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  totalRevenue: number;
}

/**
 * Top-N customers by revenue for a period.
 * Uses `/api/reports/top-customers` — the server runs `GROUP BY customer_id ORDER BY SUM(revenue) DESC LIMIT N`
 * so we no longer pull the entire revenues table.
 */
export function useTopCustomers(year: number, months: number[], topN = 5) {
  const monthsKey = [...months].sort((a, b) => a - b).join(",");
  const { data = [], isLoading } = useQuery({
    queryKey: ["top-customers", year, monthsKey, topN],
    queryFn: async () => {
      const rows = await getTopCustomers(year, months, topN);
      return rows.map(
        (r): TopCustomer => ({
          customer_id: r.customer_id,
          customer_name: r.customer_name ?? r.customer_code ?? r.customer_id,
          totalRevenue: r.total_revenue,
        }),
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: months.length > 0,
  });

  return { data, loading: isLoading };
}
