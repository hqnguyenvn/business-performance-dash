import { useQuery } from "@tanstack/react-query";
import { parameterService } from "@/services/parameterService";

interface ParameterValues {
  /** Tax rate (0.05 = 5%). `null` while loading and when no value is set. */
  taxRate: number | null;
  /** Bonus rate (0.15 = 15%). `null` while loading and when no value is set. */
  bonusRate: number | null;
  loading: boolean;
  /** True once at least one successful fetch has completed. */
  ready: boolean;
}

/**
 * Fetch the Tax/Bonus rates for a given year.
 *
 * Returns null for each rate until the fetch resolves — callers MUST gate
 * downstream work on `ready` (or `loading`) to avoid computing KPIs with
 * hard-coded fallbacks that differ from the persisted values.
 *
 * Previously this hook synchronously returned `taxRate ?? 0.05` and
 * `bonusRate ?? 0.15`, which caused every report page to flash wrong
 * numbers on first render and trigger a second aggregation fetch once the
 * real parameters arrived.
 */
export const useParameterValues = (year?: number): ParameterValues => {
  const targetYear = year || new Date().getFullYear();

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["parameters", targetYear],
    queryFn: async () => {
      const all = await parameterService.getAll();
      const relevant = all.filter(
        (p) =>
          p.year === targetYear && (p.code === "Tax" || p.code === "Bonus"),
      );
      const tax = relevant.find((p) => p.code === "Tax")?.value ?? null;
      const bonus = relevant.find((p) => p.code === "Bonus")?.value ?? null;
      return {
        taxRate: tax === null ? null : Number(tax),
        bonusRate: bonus === null ? null : Number(bonus),
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    taxRate: data?.taxRate ?? null,
    bonusRate: data?.bonusRate ?? null,
    loading: isLoading,
    ready: isSuccess,
  };
};
