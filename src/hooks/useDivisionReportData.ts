
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDivisionReportData } from "./division-report/dataFetching";
import { processDivisionReportData } from "./division-report/dataProcessing";
import { GroupedDivisionData, UseDivisionReportDataProps } from "./division-report/types";
import { MONTHS, YEARS } from "./division-report/constants";
import { useParameterValues } from "./useParameterValues";

export { MONTHS, YEARS };
export type { GroupedDivisionData };

export const useDivisionReportData = ({ selectedYear, selectedMonths }: UseDivisionReportDataProps) => {
  // Get parameter values for calculations
  const { taxRate, bonusRate, loading: paramLoading } = useParameterValues(parseInt(selectedYear));

  // Create a stable cache key
  const cacheKey = useMemo(() => [
    'division-report',
    selectedYear,
    [...selectedMonths].sort().join(','),
    bonusRate,
    taxRate
  ], [selectedYear, selectedMonths, bonusRate, taxRate]);

  // Use React Query for caching
  const {
    data: groupedData = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      const startTime = performance.now();
      
      const { revenueData, salaryData, costData, bonusData, error: fetchError } = await fetchDivisionReportData(
        selectedYear, 
        selectedMonths
      );
      
      if (fetchError) {
        throw new Error("Failed to fetch division report data");
      }

      const processedData = processDivisionReportData(
        revenueData || [],
        salaryData || [],
        costData || [],
        bonusData || [],
        bonusRate,
        taxRate
      );

      const endTime = performance.now();
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Division report data processed in ${(endTime - startTime).toFixed(2)}ms`);
      }

      return processedData;
    },
    enabled: !paramLoading && !isNaN(bonusRate) && !isNaN(taxRate),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 2, // Retry failed requests 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return { 
    groupedData, 
    loading: isLoading || paramLoading || isFetching, 
    error: error?.message || null
  };
};
