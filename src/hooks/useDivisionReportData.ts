

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processDivisionReportData } from "./division-report/dataProcessing";
import { GroupedDivisionData, UseDivisionReportDataProps } from "./division-report/types";
import { MONTHS, YEARS } from "./division-report/constants";
import { useParameterValues } from "./useParameterValues";

export { MONTHS, YEARS };
export type { GroupedDivisionData };

// Optimized data fetching function similar to Company Report
const fetchDivisionReportDataOptimized = async (selectedYear: string, selectedMonths: number[]) => {
  try {
    // OPTIMIZATION 1: Reduce parallel queries by combining related queries
    const [
      { data: revenueData, error: revenueError },
      { data: salaryData, error: salaryError },
      { data: costData, error: costError },
      { data: bonusData, error: bonusError }
    ] = await Promise.all([
      // Combined revenue query with divisions
      supabase
        .from('revenues')
        .select(`
          year, month, division_id, quantity, vnd_revenue,
          divisions!revenues_division_id_fkey(code, company_id)
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths),

      // Combined salary costs query (both with and without customer_id)
      supabase
        .from('salary_costs')
        .select('year, month, division_id, customer_id, amount')
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths),

      // Combined costs query with cost_types lookup
      supabase
        .from('costs')
        .select(`
          year, month, cost, is_cost,
          cost_types!costs_cost_type_fkey(code)
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths)
        .eq('is_cost', true),

      // Bonus data
      supabase
        .from('bonus_by_d')
        .select('year, division_id, bn_bmm')
        .eq('year', Number(selectedYear))
    ]);

    // OPTIMIZATION 2: Early error handling
    const errors = [
      { data: revenueData, error: revenueError, name: 'revenues' },
      { data: salaryData, error: salaryError, name: 'salary_costs' },
      { data: costData, error: costError, name: 'costs' },
      { data: bonusData, error: bonusError, name: 'bonus_by_d' }
    ];

    for (const { error, name } of errors) {
      if (error) {
        throw new Error(`Failed to fetch ${name} data: ${error.message}`);
      }
    }

    return {
      revenueData: revenueData || [],
      salaryData: salaryData || [],
      costData: costData || [],
      bonusData: bonusData || [],
      error: null
    };
  } catch (error) {
    console.error("Error in fetchDivisionReportDataOptimized:", error);
    throw error;
  }
};

export const useDivisionReportData = ({ selectedYear, selectedMonths }: UseDivisionReportDataProps) => {
  // Get parameter values for calculations
  const { taxRate, bonusRate, loading: paramLoading } = useParameterValues(parseInt(selectedYear));

  // OPTIMIZATION 3: Improved cache key with memoization
  const cacheKey = useMemo(() => [
    'division-report-optimized',
    selectedYear,
    [...selectedMonths].sort().join(','),
    bonusRate,
    taxRate
  ], [selectedYear, selectedMonths, bonusRate, taxRate]);

  // OPTIMIZATION 4: Improved fetch key to prevent unnecessary re-fetches
  const fetchKey = useMemo(() => 
    `${selectedYear}_${selectedMonths.join(',')}_${bonusRate}_${taxRate}`, 
    [selectedYear, selectedMonths, bonusRate, taxRate]
  );

  // Use React Query with optimized settings
  const {
    data: groupedData = [],
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      const startTime = performance.now();
      
      const { revenueData, salaryData, costData, bonusData } = await fetchDivisionReportDataOptimized(
        selectedYear, 
        selectedMonths
      );

      const processedData = processDivisionReportData(
        revenueData,
        salaryData,
        costData,
        bonusData,
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

