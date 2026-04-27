
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCosts, Cost as DbCost, CostSearchParams, CostResponse } from "@/services/costApi";
import { costTypesService, MasterData } from "@/services/masterDataService";
import { MONTHS } from "@/lib/months";

export type Cost = DbCost;
export { MONTHS };

export const useCostsState = () => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const currentYear = new Date().getFullYear();
  
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: Math.max(currentMonth - 1, 0) }, (_, i) => i + 1)
  );
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  
  const { data: paginatedResult, isLoading: isLoadingCosts } = useQuery<CostResponse>({
    queryKey: ["costs", selectedYear, selectedMonths, currentPage, pageSize],
    queryFn: () => getCosts({
      year: parseInt(selectedYear),
      months: selectedMonths,
      page: pageSize === 'all' ? undefined : currentPage,
      pageSize: pageSize
    } as CostSearchParams),
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // Replace keepPreviousData
    // Enable background refetch for better UX
    refetchInterval: 10 * 60 * 1000, // Background refetch every 10 minutes
    refetchIntervalInBackground: false,
  });

  const { data: costTypes = [], isLoading: isLoadingCostTypes } = useQuery<MasterData[]>({
    queryKey: ["cost_types"],
    queryFn: () => costTypesService.getAll(),
    staleTime: 15 * 60 * 1000, // 15 minutes - master data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  const filteredCosts = costs;
  const totalCount = paginatedResult?.total || 0;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalCount / (typeof pageSize === 'number' ? pageSize : 25));
  
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

  const handlePageSizeChange = (newPageSize: number | 'all') => {
    setPageSize(newPageSize);
    setCurrentPage(1);
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
    handlePageSizeChange,
    getMonthName,
    getCostTypeName,
    getMonthNumber,
    getCostTypeId,
  };
};
