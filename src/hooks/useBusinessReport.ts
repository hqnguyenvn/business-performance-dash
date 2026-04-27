import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  getBusinessSummary,
  getAvailableYears,
} from "@/services/reportsService";
import { exportBusinessReportCSV } from "@/utils/csvExport";
import { useParameterValues } from "@/hooks/useParameterValues";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { MONTHS } from "@/lib/months";

export { MONTHS };

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

export const useBusinessReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString(),
  );
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: Math.max(currentMonth - 1, 0) }, (_, i) => i + 1),
  );

  const {
    taxRate: paramTaxRate,
    bonusRate: paramBonusRate,
    loading: paramLoading,
  } = useParameterValues(parseInt(selectedYear));

  // Rates come from master data (Parameters in Settings). Report is view-only.
  const incomeTaxRate = paramTaxRate !== null ? paramTaxRate * 100 : null;
  const bonusRate = paramBonusRate !== null ? paramBonusRate * 100 : null;

  // --- Server-aggregated business summary ---
  const { data: summary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ["business-summary", selectedYear],
    queryFn: () => getBusinessSummary(parseInt(selectedYear)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: availableYears = [] } = useQuery({
    queryKey: ["available-years"],
    queryFn: () => getAvailableYears(),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loading = summaryLoading || paramLoading;

  const allBusinessData = useMemo<BusinessData[]>(() => {
    const tax = incomeTaxRate ?? 0;
    const bonus = bonusRate ?? 0;
    return MONTHS.map((m) => {
      const row = summary.find((s) => s.month === m.value);
      const revenue = row?.total_revenue ?? 0;
      const cost = row?.total_cost ?? 0;
      const salaryCost = row?.salary_cost ?? 0;
      const grossProfit = revenue - cost;
      const incomeTax = grossProfit < 0 ? 0 : grossProfit * (tax / 100);
      const bonusAmount = salaryCost * (bonus / 100);
      const totalCost = cost + incomeTax + bonusAmount;
      const netProfit = revenue - totalCost;
      return {
        year: parseInt(selectedYear),
        month: m.short,
        monthNumber: m.value,
        revenue,
        cost,
        grossProfit,
        incomeTax,
        bonus: bonusAmount,
        totalCost,
        netProfit,
        grossProfitPercent: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netProfitPercent: revenue > 0 ? (netProfit / revenue) * 100 : 0,
      };
    });
  }, [summary, selectedYear, incomeTaxRate, bonusRate]);

  const businessData = useMemo(
    () => allBusinessData.filter((d) => selectedMonths.includes(d.monthNumber)),
    [allBusinessData, selectedMonths],
  );

  const totals = useMemo(() => {
    const totalRevenue = businessData.reduce((s, d) => s + d.revenue, 0);
    const totalGrossProfit = businessData.reduce(
      (s, d) => s + d.grossProfit,
      0,
    );
    const totalCost = businessData.reduce((s, d) => s + d.totalCost, 0);
    const totalNetProfit = businessData.reduce((s, d) => s + d.netProfit, 0);
    const grossProfitPercent =
      totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const netProfitPercent =
      totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    return {
      totalRevenue,
      totalGrossProfit,
      totalCost,
      totalNetProfit,
      grossProfitPercent,
      netProfitPercent,
    };
  }, [businessData]);

  const stats = useDashboardStats({
    year: parseInt(selectedYear),
    months: selectedMonths,
    incomeTaxRate: incomeTaxRate ?? 0,
    bonusRate: bonusRate ?? 0,
  });

  const exportToCSV = () => {
    exportBusinessReportCSV({ data: businessData, year: selectedYear, totals });
    toast({
      title: "Export report",
      description: "Business report has been exported to CSV file successfully",
    });
  };

  const handleYearChange = (value: string) => setSelectedYear(value);
  const handleMonthToggle = (monthValue: number) =>
    setSelectedMonths((prev) =>
      prev.includes(monthValue)
        ? prev.filter((m) => m !== monthValue)
        : [...prev, monthValue].sort((a, b) => a - b),
    );

  return {
    loading,
    selectedYear,
    availableYears,
    handleYearChange,
    selectedMonths,
    setSelectedMonths,
    handleMonthToggle,
    incomeTaxRate,
    bonusRate,
    businessData,
    totals,
    stats,
    exportToCSV,
    MONTHS,
  };
};
