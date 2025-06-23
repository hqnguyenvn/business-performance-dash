import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportBusinessReportCSV } from "@/utils/csvExport";
import { useParameterValues } from "@/hooks/useParameterValues";
import { useQuery } from "@tanstack/react-query";

export interface BusinessData {
  year: number;
  month: string;
  monthNumber: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  incomeTax: number;
  bonus: number;
  totalCost: number;
  netProfit: number;
  grossProfitPercent: number;
  netProfitPercent: number;
}

interface RevenueData {
  id: string;
  year: number;
  month: number;
  vnd_revenue: number;
  [key: string]: any;
}

interface CostData {
  id: string;
  year: number;
  month: number;
  cost: number;
  cost_type: string;
  [key: string]: any;
}

interface CostTypeData {
  id: string;
  code: string;
}

export const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" }
];

export const useBusinessReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: currentMonth }, (_, i) => i + 1)
  );

  // Get parameter values from database
  const { taxRate: paramTaxRate, bonusRate: paramBonusRate, loading: paramLoading } = useParameterValues(parseInt(selectedYear));

  const [incomeTaxRate, setIncomeTaxRate] = useState<number | null>(null);
  const [bonusRate, setBonusRate] = useState<number | null>(null);

  // Update rates when parameter values are loaded - convert to percentage for display
  useEffect(() => {
    if (!paramLoading) {
      setIncomeTaxRate(paramTaxRate * 100); // Convert 0.05 to 5 for display
      setBonusRate(paramBonusRate * 100);   // Convert 0.15 to 15 for display
    }
  }, [paramTaxRate, paramBonusRate, paramLoading]);

  // Fetch revenues with caching
  const { data: revenues = [], isLoading: revenuesLoading } = useQuery({
    queryKey: ['revenues', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .eq('year', parseInt(selectedYear));
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch costs with caching
  const { data: costs = [], isLoading: costsLoading } = useQuery({
    queryKey: ['costs', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .eq('year', parseInt(selectedYear));
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch cost types with caching (this rarely changes)
  const { data: costTypes = [], isLoading: costTypesLoading } = useQuery({
    queryKey: ['costTypes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_types').select('id, code');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch available years with caching
  const { data: availableYears = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['availableYears'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenues')
        .select('year')
        .order('year', { ascending: false });
      if (error) throw error;
      
      const revenueYears = data?.map(r => r.year) || [];
      const allYears = Array.from(new Set([...revenueYears, currentYear])).sort((a, b) => b - a);
      return allYears;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });

  const loading = revenuesLoading || costsLoading || costTypesLoading || yearsLoading;

  const allBusinessData = useMemo(() => {
    const businessDataMap = new Map<string, BusinessData>();

    const salaryCostType = costTypes.find(ct => ct.code.toLowerCase() === 'salary');
    const salaryCostTypeId = salaryCostType ? salaryCostType.id : null;

    MONTHS.forEach(month => {
      const key = `${selectedYear}-${month.value}`;
      businessDataMap.set(key, {
        year: parseInt(selectedYear),
        month: month.short,
        monthNumber: month.value,
        revenue: 0, cost: 0, grossProfit: 0, incomeTax: 0, bonus: 0,
        totalCost: 0, netProfit: 0, grossProfitPercent: 0, netProfitPercent: 0,
      });
    });

    revenues.forEach(r => {
      const entry = businessDataMap.get(`${r.year}-${r.month}`);
      if (entry) entry.revenue += r.vnd_revenue || 0;
    });

    costs.forEach(c => {
      const entry = businessDataMap.get(`${c.year}-${c.month}`);
      if (entry) entry.cost += c.cost || 0;
    });

    Array.from(businessDataMap.values()).forEach(data => {
      data.grossProfit = data.revenue - data.cost;
      data.incomeTax = data.grossProfit < 0 ? 0 : data.grossProfit * (incomeTaxRate / 100);

      let monthlySalaryCost = 0;
      if (salaryCostTypeId) {
        monthlySalaryCost = costs
          .filter(c => 
            c.month === data.monthNumber && 
            c.cost_type === salaryCostTypeId
          )
          .reduce((sum, c) => sum + (c.cost || 0), 0);
      }
      data.bonus = monthlySalaryCost * (bonusRate / 100);

      data.totalCost = data.cost + data.incomeTax + data.bonus;
      data.netProfit = data.revenue - data.totalCost;
      data.grossProfitPercent = data.revenue > 0 ? (data.grossProfit / data.revenue) * 100 : 0;
      data.netProfitPercent = data.revenue > 0 ? (data.netProfit / data.revenue) * 100 : 0;
    });

    return Array.from(businessDataMap.values()).sort((a, b) => a.monthNumber - b.monthNumber);
  }, [revenues, costs, selectedYear, incomeTaxRate, bonusRate, costTypes]);

  // Handle query errors
  useEffect(() => {
    if (revenuesLoading || costsLoading || costTypesLoading || yearsLoading) return;
    
    // Show error toast if any query failed
    const hasError = !revenues || !costs || !costTypes || !availableYears;
    if (hasError) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch data from database", 
        variant: "destructive" 
      });
    }
  }, [revenuesLoading, costsLoading, costTypesLoading, yearsLoading, revenues, costs, costTypes, availableYears, toast]);

  const businessData = useMemo(() => allBusinessData.filter(data => 
    selectedMonths.includes(data.monthNumber)
  ), [allBusinessData, selectedMonths]);

  const exportToCSV = () => {
    exportBusinessReportCSV({ data: businessData, year: selectedYear, totals });
    toast({
      title: "Export report",
      description: "Business report has been exported to CSV file successfully",
    });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort((a, b) => a - b);
      return newMonths;
    });
  };

  const totals = useMemo(() => {
    const totalRevenue = businessData.reduce((sum, data) => sum + data.revenue, 0);
    const totalGrossProfit = businessData.reduce((sum, data) => sum + data.grossProfit, 0);
    const totalCost = businessData.reduce((sum, data) => sum + data.totalCost, 0);
    const totalNetProfit = businessData.reduce((sum, data) => sum + data.netProfit, 0);
    const grossProfitPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const netProfitPercent = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalGrossProfit, totalCost, totalNetProfit, grossProfitPercent, netProfitPercent };
  }, [businessData]);

  return {
    loading,
    selectedYear,
    availableYears,
    handleYearChange,
    selectedMonths,
    handleMonthToggle,
    incomeTaxRate,
    setIncomeTaxRate,
    bonusRate,
    setBonusRate,
    businessData,
    totals,
    exportToCSV,
    MONTHS,
  };
};