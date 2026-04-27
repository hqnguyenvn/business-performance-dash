
import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building, Loader2, Search, Download, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportTable } from "@/components/customer-report/ReportTable";
import { StatCards } from "@/components/dashboard/StatCards";
import { exportCustomerReportCSV } from "@/utils/customerReportExport";
import { useCompanyReportData, MONTHS, YEARS, GroupedCompanyData } from "@/hooks/useCompanyReportData";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useParameterValues } from "@/hooks/useParameterValues";
import { formatNumber } from "@/lib/format";
import PaginationControls from "@/components/PaginationControls";

const CompanyReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: Math.max(currentMonth - 1, 0) }, (_, i) => i + 1)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [filteredCount, setFilteredCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [tableFilteredData, setTableFilteredData] = useState<GroupedCompanyData[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalBMM: 0,
    totalBonus: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPercent: 0
  });

  const { groupedData, loading } = useCompanyReportData({
    selectedYear,
    selectedMonths
  });

  // Show loading indicator when data is being fetched
  const isDataLoading = loading || (groupedData.length === 0 && loading);

  const handleFilteredDataChange = useCallback((filtered: any[]) => {
    setTableFilteredData(filtered as GroupedCompanyData[]);
  }, []);

  const handleTotalsChange = useCallback((newTotals: typeof totals) => {
    setTotals(newTotals);
  }, []);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredCount(count);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number | 'all') => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const totalItems = filteredCount;
  const effectivePageSize = typeof pageSize === 'number' ? pageSize : totalItems;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / (effectivePageSize || 1));
  const startIndex = totalItems > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  const exportToCSV = () => {
    if (groupedData.length === 0) {
      toast({
        variant: "destructive",
        title: "Không có dữ liệu",
        description: "Không có dữ liệu để xuất file CSV.",
      });
      return;
    }

    exportCustomerReportCSV(groupedData as any, 0);
    toast({
      title: "Export Successful",
      description: "Company report has been successfully exported as a CSV file.",
    });
  };

  const { totalProfitPercent } = totals;

  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));
  const stats = useDashboardStats({
    year: parseInt(selectedYear),
    months: selectedMonths,
    incomeTaxRate: taxRate !== null ? taxRate * 100 : 0,
    bonusRate: bonusRate !== null ? bonusRate * 100 : 0,
  });

  const fmtChange = (p: number | null | undefined) =>
    typeof p === "number" ? `${p > 0 ? "+" : ""}${p.toFixed(1)}%` : "--";

  const summaryStats = [
    {
      title: "Revenue (VND)",
      value: formatNumber(stats.totalRevenue.value),
      percentChange: stats.totalRevenue.percentChange,
      change: fmtChange(stats.totalRevenue.percentChange),
      icon: DollarSign,
      color: "text-blue-600",
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
      title: `Net Profit (VND — ${totalProfitPercent.toFixed(1)}%)`,
      value: formatNumber(stats.netProfit.value),
      percentChange: stats.netProfit.percentChange,
      change: fmtChange(stats.netProfit.percentChange),
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Total BMM",
      value: formatNumber(stats.totalBMM.value),
      percentChange: stats.totalBMM.percentChange,
      change: fmtChange(stats.totalBMM.percentChange),
      icon: Users,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Company Report"
        description="Business performance report by company"
        icon={Building}
      />
      <div className="p-6">
        <StatCards groups={[{ label: `Company Performance ${selectedYear}`, stats: summaryStats }]} />

        <ReportFilter
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          months={MONTHS}
          years={YEARS}
          title="Filter Company Report"
        />

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Company Report
              {isDataLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
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
            {isDataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-lg">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <ReportTable
                data={groupedData as any}
                loading={loading}
                paginatedData={groupedData as any}
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={handlePageChange}
                goToNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                goToPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1); }}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                pageSize={pageSize}
                bonusRate={0}
                companyLabel="Company"
                searchTerm={searchTerm}
                onFilteredDataChange={handleFilteredDataChange}
                onTotalsChange={handleTotalsChange}
                onFilteredCountChange={handleFilteredCountChange}
              />
            )}
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

export default CompanyReport;
