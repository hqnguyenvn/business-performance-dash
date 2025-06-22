
import { useState, useEffect, useMemo } from "react";
import { fetchDivisionReportData } from "./division-report/dataFetching";
import { processDivisionReportData } from "./division-report/dataProcessing";
import { GroupedDivisionData, UseDivisionReportDataProps } from "./division-report/types";
import { MONTHS, YEARS } from "./division-report/constants";
import { useParameterValues } from "./useParameterValues";

export { MONTHS, YEARS };
export type { GroupedDivisionData };

export const useDivisionReportData = ({ selectedYear, selectedMonths }: UseDivisionReportDataProps) => {
  const [groupedData, setGroupedData] = useState<GroupedDivisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get parameter values for calculations
  const { taxRate, bonusRate, loading: paramLoading } = useParameterValues(parseInt(selectedYear));

  // Memoize the fetch dependencies to prevent unnecessary re-fetches
  const fetchDependencies = useMemo(() => ({
    selectedYear,
    selectedMonths: [...selectedMonths].sort(),
    bonusRate,
    taxRate
  }), [selectedYear, selectedMonths, bonusRate, taxRate]);

  useEffect(() => {
    // Don't fetch if parameters are still loading
    if (paramLoading) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const startTime = performance.now();
        
        const { revenueData, salaryData, costData, bonusData, error: fetchError } = await fetchDivisionReportData(
          fetchDependencies.selectedYear, 
          fetchDependencies.selectedMonths
        );
        
        if (fetchError) {
          setError("Failed to fetch division report data");
          setGroupedData([]);
          return;
        }

        const processedData = processDivisionReportData(
          revenueData || [],
          salaryData || [],
          costData || [],
          bonusData || [],
          fetchDependencies.bonusRate,
          fetchDependencies.taxRate
        );

        const endTime = performance.now();
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Division report data processed in ${(endTime - startTime).toFixed(2)}ms`);
        }

        setGroupedData(processedData);
      } catch (error) {
        setError("An unexpected error occurred while loading division report data");
        setGroupedData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchDependencies, paramLoading]);

  return { 
    groupedData, 
    loading: loading || paramLoading, 
    error 
  };
};
