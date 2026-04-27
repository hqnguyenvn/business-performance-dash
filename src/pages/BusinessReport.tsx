
import { useState } from "react";
import { useBusinessReport } from "@/hooks/useBusinessReport";
import { BusinessReportHeader } from "@/components/business-report/BusinessReportHeader";
import { BusinessReportFilters } from "@/components/business-report/BusinessReportFilters";
import { BusinessReportTable } from "@/components/business-report/BusinessReportTable";
import { StatCards } from "@/components/dashboard/StatCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/format";
import PaginationControls from "@/components/PaginationControls";

const BusinessReport = () => {
  const {
    loading,
    selectedYear,
    availableYears,
    handleYearChange,
    selectedMonths,
    setSelectedMonths,
    handleMonthToggle,
    businessData,
    totals,
    stats,
    exportToCSV,
    MONTHS,
  } = useBusinessReport();

  const fmtChange = (p: number | null | undefined) =>
    typeof p === "number"
      ? `${p > 0 ? "+" : ""}${p.toFixed(1)}%`
      : "--";

  const businessStats = [
    {
      title: "Revenue (VND)",
      value: formatNumber(stats.totalRevenue.value),
      percentChange: stats.totalRevenue.percentChange,
      change: fmtChange(stats.totalRevenue.percentChange),
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: `Gross Profit (VND — ${totals.grossProfitPercent.toFixed(1)}%)`,
      value: formatNumber(stats.grossProfit.value),
      percentChange: stats.grossProfit.percentChange,
      change: fmtChange(stats.grossProfit.percentChange),
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Total Cost (VND)",
      value: formatNumber(stats.totalCost.value),
      percentChange: stats.totalCost.percentChange,
      change: fmtChange(stats.totalCost.percentChange),
      icon: Receipt,
      color: "text-red-600",
    },
    {
      title: `Net Profit (VND — ${totals.netProfitPercent.toFixed(1)}%)`,
      value: formatNumber(stats.netProfit.value),
      percentChange: stats.netProfit.percentChange,
      change: fmtChange(stats.netProfit.percentChange),
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>('all');

  const filteredBusinessData = searchTerm.trim()
    ? businessData.filter((row) => {
        const lower = searchTerm.trim().toLowerCase();
        return row.month.toLowerCase().includes(lower) || String(row.year).includes(lower);
      })
    : businessData;

  const totalItems = filteredBusinessData.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / (pageSize as number));
  const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * (pageSize as number);
  const endIndex = pageSize === 'all' ? totalItems - 1 : Math.min(startIndex + (pageSize as number) - 1, totalItems - 1);
  const paginatedData = pageSize === 'all' ? filteredBusinessData : filteredBusinessData.slice(startIndex, endIndex + 1);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number | 'all') => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BusinessReportHeader />

      <div className="p-6">
        <StatCards groups={[{ label: `Business Performance ${selectedYear}`, stats: businessStats }]} />

        <BusinessReportFilters
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={handleYearChange}
          selectedMonths={selectedMonths}
          onMonthToggle={handleMonthToggle}
          setSelectedMonths={setSelectedMonths}
          months={MONTHS}
        />

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Detailed Report ({filteredBusinessData.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <div className="flex gap-2 md:w-1/3">
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setSearchTerm(searchTerm)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  position="top"
                />
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            <BusinessReportTable
              businessData={paginatedData}
              searchTerm=""
            />
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={pageSize}
              position="bottom"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessReport;
