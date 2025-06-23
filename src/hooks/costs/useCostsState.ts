
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { costService, Cost as DbCost } from "@/services/costService";
import { costTypesService, MasterData } from "@/services/masterDataService";

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  
  const { data: paginatedResult, isLoading: isLoadingCosts } = useQuery({
    queryKey: ["costs", selectedYear, selectedMonths, currentPage, pageSize],
    queryFn: () => costService.getPaginated({
      year: parseInt(selectedYear),
      months: selectedMonths,
      page: currentPage,
      pageSize: pageSize
    }),
    keepPreviousData: true, // Keep previous data while loading new page
  });

  const { data: costTypes = [], isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["cost_types"],
    queryFn: () => costTypesService.getAll(),
  });

  useEffect(() => {
    if (paginatedResult?.data) {
      setCosts(paginatedResult.data);
    }
  }, [paginatedResult]);

  const availableYears = useMemo(() => {
    const startYear = 2020;
    const endYear = 2035;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  }, []);

  // Since data is already filtered server-side, filteredCosts = costs
  const filteredCosts = costs;
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort((a,b) => a-b);
      return newMonths;
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    // Pagination data
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    handleYearChange,
    handleMonthToggle,
    handlePageChange,
    getMonthName,
    getCostTypeName,
    getMonthNumber,
    getCostTypeId,
  };
};
