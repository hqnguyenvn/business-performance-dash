import { useQuery } from "@tanstack/react-query";
import { getPlanVsActual, type PlanVsActualRow } from "@/services/reportsService";

export function usePlanVsActual(year: number) {
  const { data = [], isLoading: loading } = useQuery<PlanVsActualRow[]>({
    queryKey: ["plan-vs-actual", year],
    queryFn: () => getPlanVsActual(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { data, loading };
}
