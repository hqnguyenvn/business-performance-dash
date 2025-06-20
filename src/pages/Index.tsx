
import { PageHeader } from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { StatCards } from "@/components/dashboard/StatCards";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { DollarSign, Receipt, TrendingUp, Users } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useParameterValues } from "@/hooks/useParameterValues";
import { formatNumber } from "@/lib/format";

// Month & year options
const months = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const years = Array.from({ length: 2035 - 2020 + 1 }, (_, idx) => 2020 + idx);

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // getMonth trả về 0-11

const Index = () => {
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: currentMonth }, (_, idx) => idx + 1)
  );
  
  // Get parameter values from database
  const { taxRate: paramTaxRate, bonusRate: paramBonusRate, loading: paramLoading } = useParameterValues(selectedYear);
  
  const [incomeTaxRate, setIncomeTaxRate] = useState<number | null>(null);
  const [bonusRate, setBonusRate] = useState<number | null>(null);

  // Update rates when parameter values are loaded - convert to percentage for display
  useEffect(() => {
    if (!paramLoading) {
      setIncomeTaxRate(paramTaxRate * 100); // Convert 0.05 to 5 for display
      setBonusRate(paramBonusRate * 100);   // Convert 0.15 to 15 for display
    }
  }, [paramTaxRate, paramBonusRate, paramLoading]);

  // Month toggle utility
  const handleMonthToggle = (month: number) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  // Lấy dữ liệu thống kê mới - use fallback values if parameters not loaded
  const stats = useDashboardStats({
    year: selectedYear,
    months: selectedMonths,
    incomeTaxRate: incomeTaxRate ?? 5, // Fallback to 5% if not loaded
    bonusRate: bonusRate ?? 15, // Fallback to 15% if not loaded
  });

  const statCardsData = [
    {
      title: "Total Revenue",
      value: stats.loading ? "..." : `${formatNumber(stats.totalRevenue.value / 1_000_000)}M VND`,
      percentChange: stats.totalRevenue.percentChange,
      change: stats.loading ? "--" : (typeof stats.totalRevenue.percentChange === "number"
        ? `${stats.totalRevenue.percentChange > 0 ? "+" : ""}${stats.totalRevenue.percentChange.toFixed(1)}%`
        : "--"),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Cost",
      value: stats.loading ? "..." : `${formatNumber(stats.totalCost.value / 1_000_000)}M VND`,
      percentChange: stats.totalCost.percentChange,
      change: stats.loading ? "--" : (typeof stats.totalCost.percentChange === "number"
        ? `${stats.totalCost.percentChange > 0 ? "+" : ""}${stats.totalCost.percentChange.toFixed(1)}%`
        : "--"),
      icon: Receipt,
      color: "text-red-600",
    },
    {
      title: "Net Profit",
      value: stats.loading ? "..." : `${formatNumber(stats.netProfit.value / 1_000_000)}M VND`,
      percentChange: stats.netProfit.percentChange,
      change: stats.loading ? "--" : (typeof stats.netProfit.percentChange === "number"
        ? `${stats.netProfit.percentChange > 0 ? "+" : ""}${stats.netProfit.percentChange.toFixed(1)}%`
        : "--"),
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Customers",
      value: stats.loading ? "..." : stats.customerCount.value.toString(),
      percentChange: stats.customerCount.percentChange,
      change: stats.loading ? "--" : (typeof stats.customerCount.percentChange === "number"
        ? `${stats.customerCount.percentChange > 0 ? "+" : ""}${stats.customerCount.percentChange.toFixed(1)}%`
        : "--"),
      icon: Users,
      color: "text-purple-600",
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
        <StatCards stats={statCardsData} />

        <div className="mx-0 mt-6">
          <DashboardFilter
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            years={years}
            months={months}
            selectedMonths={selectedMonths}
            setSelectedMonths={setSelectedMonths}
            onMonthToggle={handleMonthToggle}
            incomeTaxRate={incomeTaxRate ?? 5}
            setIncomeTaxRate={setIncomeTaxRate}
            bonusRate={bonusRate ?? 15}
            setBonusRate={setBonusRate}
          />
        </div>

        <div className="mt-6">
          <DashboardWidgets selectedYear={selectedYear} selectedMonths={selectedMonths} />
        </div>
      </div>
    </div>
  );
};

export default Index;
