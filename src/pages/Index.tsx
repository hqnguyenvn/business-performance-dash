
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { StatCards } from "@/components/dashboard/StatCards";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { DollarSign, Receipt, TrendingUp, Users, Activity, ChartPie } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useParameterValues } from "@/hooks/useParameterValues";
import { formatNumber } from "@/lib/format";
import { MONTHS as MONTHS_FULL, YEARS as years } from "@/lib/months";

// Dashboard uses short labels ("Jan", "Feb", ...)
const months = MONTHS_FULL.map((m) => ({ value: m.value, label: m.short }));

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // getMonth trả về 0-11

const Index = () => {
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: Math.max(currentMonth - 1, 0) }, (_, idx) => idx + 1)
  );
  
  // Parameter values from database. The hook returns null while loading so
  // we can show a spinner instead of flashing placeholder KPIs.
  const {
    taxRate: paramTaxRate,
    bonusRate: paramBonusRate,
    ready: paramsReady,
  } = useParameterValues(selectedYear);

  // Rates come from master data (Parameters in Settings). Dashboard is view-only.
  const incomeTaxRate = paramTaxRate !== null ? paramTaxRate * 100 : null;
  const bonusRate = paramBonusRate !== null ? paramBonusRate * 100 : null;

  // Month toggle utility
  const handleMonthToggle = (month: number) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  // Stats are only valid once parameters are loaded — before that the hook
  // waits and returns a "loading" result so the UI shows a spinner.
  const stats = useDashboardStats({
    year: selectedYear,
    months: selectedMonths,
    incomeTaxRate: incomeTaxRate ?? 0,
    bonusRate: bonusRate ?? 0,
  });
  const statsLoading = stats.loading || !paramsReady;

  const grossPct = stats.totalRevenue.value > 0 ? ((stats.grossProfit.value / stats.totalRevenue.value) * 100).toFixed(1) : "0.0";
  const netPct = stats.totalRevenue.value > 0 ? ((stats.netProfit.value / stats.totalRevenue.value) * 100).toFixed(1) : "0.0";

  const businessStats = [
    {
      title: "Revenue (VND)",
      value: statsLoading ? "..." : formatNumber(stats.totalRevenue.value),
      percentChange: stats.totalRevenue.percentChange,
      change: statsLoading ? "--" : (typeof stats.totalRevenue.percentChange === "number"
        ? `${stats.totalRevenue.percentChange > 0 ? "+" : ""}${stats.totalRevenue.percentChange.toFixed(1)}%`
        : "--"),
      planPercent: stats.totalRevenue.planPercent,
      planChange: statsLoading ? "--" : (typeof stats.totalRevenue.planPercent === "number"
        ? `${stats.totalRevenue.planPercent > 0 ? "+" : ""}${stats.totalRevenue.planPercent.toFixed(1)}%`
        : "--"),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Cost (VND)",
      value: statsLoading ? "..." : formatNumber(stats.totalCost.value),
      percentChange: stats.totalCost.percentChange,
      change: statsLoading ? "--" : (typeof stats.totalCost.percentChange === "number"
        ? `${stats.totalCost.percentChange > 0 ? "+" : ""}${stats.totalCost.percentChange.toFixed(1)}%`
        : "--"),
      icon: Receipt,
      color: "text-red-600",
    },
    {
      title: statsLoading ? "Gross Profit (VND)" : `Gross Profit (VND — ${grossPct}%)`,
      value: statsLoading ? "..." : formatNumber(stats.grossProfit.value),
      percentChange: stats.grossProfit.percentChange,
      change: statsLoading ? "--" : (typeof stats.grossProfit.percentChange === "number"
        ? `${stats.grossProfit.percentChange > 0 ? "+" : ""}${stats.grossProfit.percentChange.toFixed(1)}%`
        : "--"),
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      title: statsLoading ? "Net Profit (VND)" : `Net Profit (VND — ${netPct}%)`,
      value: statsLoading ? "..." : formatNumber(stats.netProfit.value),
      percentChange: stats.netProfit.percentChange,
      change: statsLoading ? "--" : (typeof stats.netProfit.percentChange === "number"
        ? `${stats.netProfit.percentChange > 0 ? "+" : ""}${stats.netProfit.percentChange.toFixed(1)}%`
        : "--"),
      icon: TrendingUp,
      color: "text-blue-600",
    },
  ];

  const kpiStats = [
    {
      title: "Customers",
      value: statsLoading ? "..." : stats.customerCount.value.toString(),
      percentChange: stats.customerCount.percentChange,
      change: statsLoading ? "--" : (typeof stats.customerCount.percentChange === "number"
        ? `${stats.customerCount.percentChange > 0 ? "+" : ""}${stats.customerCount.percentChange.toFixed(1)}%`
        : "--"),
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: statsLoading ? "Development EE" : `Dev EE (${stats.devEEBMM.toFixed(2)}/${stats.devEECMM.toFixed(2)})`,
      value: statsLoading ? "..." : `${(stats.devEE.value * 100).toFixed(1)}%`,
      percentChange: stats.devEE.percentChange,
      change: statsLoading ? "--" : (typeof stats.devEE.percentChange === "number"
        ? `${stats.devEE.percentChange > 0 ? "+" : ""}${stats.devEE.percentChange.toFixed(1)}%`
        : "--"),
      icon: Activity,
      color: "text-teal-600",
    },
    {
      title: statsLoading ? "EE" : `EE (${stats.eeBMM.toFixed(2)}/${stats.eeCMM.toFixed(2)})`,
      value: statsLoading ? "..." : `${(stats.ee.value * 100).toFixed(1)}%`,
      percentChange: stats.ee.percentChange,
      change: statsLoading ? "--" : (typeof stats.ee.percentChange === "number"
        ? `${stats.ee.percentChange > 0 ? "+" : ""}${stats.ee.percentChange.toFixed(1)}%`
        : "--"),
      icon: Activity,
      color: "text-orange-600",
    },
    {
      title: "Overhead",
      value: statsLoading ? "..." : `${(stats.overheadRatio.value * 100).toFixed(1)}%`,
      percentChange: stats.overheadRatio.percentChange,
      change: statsLoading ? "--" : (typeof stats.overheadRatio.percentChange === "number"
        ? `${stats.overheadRatio.percentChange > 0 ? "+" : ""}${stats.overheadRatio.percentChange.toFixed(1)}%`
        : "--"),
      icon: ChartPie,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Dashboard"
        description="Business overview"
        icon={DollarSign}
      />

      <div className="p-6">
        <DashboardFilter
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          years={years}
          months={months}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          onMonthToggle={handleMonthToggle}
        />

        <StatCards groups={[
          { label: "Business Performance", stats: businessStats },
          { label: "KPIs", stats: kpiStats },
        ]} />

        <DashboardWidgets selectedYear={selectedYear} selectedMonths={selectedMonths} />
      </div>
    </div>
  );
};

export default Index;
