import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSalaryCostsPaginated, SalaryCost, SalaryCostFilters } from '@/services/salaryCostService';
import { getMasterDatas, MasterData } from '@/services/masterDataService';

export { type SalaryCost };
export const MONTHS = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: new Date(0, i).toLocaleString('en', { month: 'short' }) }));

export const useSalaryCostsState = () => {
  const [salaryCosts, setSalaryCosts] = useState<SalaryCost[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Mặc định chọn các tháng từ tháng 1 đến tháng hiện tại
  const currentMonth = new Date().getMonth() + 1;
  const defaultSelectedMonths = Array.from({ length: currentMonth }, (_, i) => i + 1);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(defaultSelectedMonths);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Simple filter approach like Cost Management
  const { data: paginatedData, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['salaryCosts', selectedYear, selectedMonths, currentPage, pageSize],
    queryFn: () => getSalaryCostsPaginated({
      year: parseInt(selectedYear),
      months: selectedMonths
    }, currentPage, pageSize),
    enabled: !!selectedYear && selectedMonths.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({ queryKey: ['companies'], queryFn: () => getMasterDatas('companies') });
  const { data: divisions = [], isLoading: isLoadingDivisions } = useQuery({ queryKey: ['divisions'], queryFn: () => getMasterDatas('divisions') });
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({ queryKey: ['customers'], queryFn: () => getMasterDatas('customers') });

  const isLoading = isLoadingCosts || isLoadingCompanies || isLoadingDivisions || isLoadingCustomers;

  useEffect(() => {
    if (paginatedData?.data) {
      setSalaryCosts(paginatedData.data);
    }
  }, [paginatedData]);

  // Reset to page 1 when filters change (simple approach like Cost Management)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonths]);

  const availableYears = useMemo(() => {
    const startYear = 2020;
    const endYear = 2035;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  }, []);

  // With pagination, filtered data is the current page data
  const filteredSalaryCosts = salaryCosts;

  const getMonthName = (monthNumber: number) => MONTHS.find(m => m.id === monthNumber)?.name || 'N/A';
  const getMasterDataName = (id: string | null, data: MasterData[], field: 'code' | 'name' = 'name') => data.find(d => d.id === id)?.[field] || '';
  const getMasterDataId = (code: string, data: MasterData[]) => data.find(d => d.code === code)?.id || null;
  const getMonthNumber = (name: string) => MONTHS.find(m => m.name === name)?.id || 1;


  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
  }, [setSelectedYear]);

  const handleMonthToggle = useCallback((monthId: number) => {
    setSelectedMonths(prev =>
      prev.includes(monthId) ? prev.filter(m => m !== monthId) : [...prev, monthId]
    );
  }, [setSelectedMonths]);

  return {
    salaryCosts, setSalaryCosts,
    selectedYear, handleYearChange,
    selectedMonths, handleMonthToggle,
    isLoading,
    companies, divisions, customers,
    availableYears,
    filteredSalaryCosts,
    getMonthName, getMasterDataName, getMasterDataId, getMonthNumber,
    // Pagination data
    currentPage, setCurrentPage,
    pageSize,
    totalRecords: paginatedData?.total || 0,
    totalPages: Math.ceil((paginatedData?.total || 0) / pageSize)
  };
};