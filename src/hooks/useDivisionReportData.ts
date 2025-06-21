
import { useState, useEffect } from "react";
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
  
  // Get parameter values for calculations
  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { revenueData, salaryData, costData, bonusData, error } = await fetchDivisionReportData(selectedYear, selectedMonths);
        
        if (error) {
          console.error("Error fetching division report data:", error);
          setGroupedData([]);
          return;
        }

        const processedData = processDivisionReportData(
          revenueData || [],
          salaryData || [],
          costData || [],
          bonusData || [],
          bonusRate,
          taxRate
        );

        setGroupedData(processedData);
      } catch (error) {
        console.error("Error in useDivisionReportData:", error);
        setGroupedData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonths, bonusRate, taxRate]);

  return { groupedData, loading };
};
