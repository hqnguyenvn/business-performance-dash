
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { costService, Cost as DbCost } from "@/services/costService";
import { costTypesService, MasterData } from "@/services/masterDataService";
import { useTableFilter } from "@/hooks/useTableFilter";

export type Cost = DbCost;

export const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
];

export const useCostsState = () => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const currentYear = new Date().getFullYear();
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const { data: dbCosts, isLoading: isLoadingCosts } = useQuery({
    queryKey: ["costs"],
    queryFn: () => costService.getAll(),
  });

  const { data: costTypes = [], isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["cost_types"],
    queryFn: () => costTypesService.getAll(),
  });

  useEffect(() => {
    if (dbCosts) {
      setCosts(dbCosts);
    }
  }, [dbCosts]);

  const availableYears = useMemo(() => {
    const startYear = 2020;
    const endYear = 2035;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  }, []);

  const baseCosts = useMemo(() => {
    return costs.filter(cost => {
      const yearMatch = cost.year === parseInt(selectedYear);
      const monthMatch = selectedMonths.includes(cost.month);
      return yearMatch && monthMatch;
    });
  }, [costs, selectedYear, selectedMonths]);

  const { filteredData: filteredCosts } = useTableFilter(baseCosts);
  
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort((a,b) => a-b);
      return newMonths;
    });
  };

  const getMonthName = (monthNumber: number) => {
    const month = MONTHS.find(m => m.value === monthNumber);
    return month ? month.label : monthNumber.toString();
  };

  const getCostTypeName = (costTypeId: string): string => {
    if (!costTypeId) return "";
    const costType = costTypes.find(c => c.id === costTypeId);
    return costType ? costType.code : "";
  };
  
  const getMonthNumber = (monthName: string): number => {
    if (!monthName) return 0;
    const month = MONTHS.find(m => m.label.toLowerCase() === monthName.toLowerCase().trim());
    return month ? month.value : 0;
  };

  const getCostTypeId = (costTypeCode: string): string => {
    if (!costTypeCode) return "";
    const costType = costTypes.find(c => c.code.toLowerCase() === costTypeCode.toLowerCase().trim());
    return costType ? costType.id : "";
  };

  return {
    costs,
    setCosts,
    selectedYear,
    setSelectedYear,
    selectedMonths,
    setSelectedMonths,
    isLoading: isLoadingCosts || isLoadingCostTypes,
    costTypes,
    availableYears,
    filteredCosts,
    handleYearChange,
    handleMonthToggle,
    getMonthName,
    getCostTypeName,
    getMonthNumber,
    getCostTypeId,
  };
};

