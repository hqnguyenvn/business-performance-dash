
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { StatCards } from "@/components/dashboard/StatCards";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { DollarSign, Receipt, TrendingUp, Users } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

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

const Index = () => {
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(5);
  const [bonusRate, setBonusRate] = useState<number>(15);

  // Month toggle utility
  const handleMonthToggle = (month: number) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  // Get live dashboard stats!
  const {
    totalRevenue,
    totalCost,
    netProfit,
    customerCount,
    loading: statsLoading,
  } = useDashboardStats({
    year: selectedYear,
    months: selectedMonths,
    incomeTaxRate,
    bonusRate,
  });

  const statCardsData = [
    {
      title: "Total Revenue",
      value: statsLoading ? "..." : `${(totalRevenue / 1_000_000).toLocaleString()}M VND`,
      change: "--",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Cost",
      value: statsLoading ? "..." : `${(totalCost / 1_000_000).toLocaleString()}M VND`,
      change: "--",
      icon: Receipt,
      color: "text-red-600",
    },
    {
      title: "Net Profit",
      value: statsLoading ? "..." : `${(netProfit / 1_000_000).toLocaleString()}M VND`,
      change: "--",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Customers",
      value: statsLoading ? "..." : customerCount.toString(),
      change: "--",
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

      <div className="mx-3 md:mx-6 mt-6">
        <DashboardFilter
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          years={years}
          months={months}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          onMonthToggle={handleMonthToggle}
          incomeTaxRate={incomeTaxRate}
          setIncomeTaxRate={setIncomeTaxRate}
          bonusRate={bonusRate}
          setBonusRate={setBonusRate}
        />
      </div>

      <div className="p-6">
        <StatCards stats={statCardsData} />
        <DashboardWidgets />
      </div>
    </div>
  );
};

export default Index;
