
import { useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Loader2, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParameterValues } from "@/hooks/useParameterValues";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportSummary } from "@/components/customer-report/ReportSummary";
import { ReportTable } from "@/components/customer-report/ReportTable";
import { exportCustomerReportCSV } from "@/utils/customerReportExport";
import { useDivisionReportData, MONTHS, YEARS, type GroupedDivisionData } from "@/hooks/useDivisionReportData";
import PaginationControls from "@/components/PaginationControls";

const DivisionReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(Array.from({ length: Math.max(currentMonth - 1, 0) }, (_, i) => i + 1));

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [filteredCount, setFilteredCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

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
  const totalPagesDivision = pageSize === 'all' ? 1 : Math.ceil(totalItems / (effectivePageSize || 1));
  const startIndex = totalItems > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  // Get parameter values from database
  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  const { groupedData, loading } = useDivisionReportData({
    selectedYear,
    selectedMonths
  });

  // Show loading indicator when data is being fetched
  const isDataLoading = loading || (groupedData.length === 0 && loading);

  // Map dữ liệu sang format ReportTable mong muốn: company_code => division_code
  const mappedData = groupedData.map((row) => ({
    ...row,
    company_code: row.division_code, // Gắn division_code vào field company_code để tận dụng component hiện tại
    company_id: row.division_id      // Trường company_id dùng cho key và filter
  }));

  const exportToCSV = () => {
    if (groupedData.length === 0) {
      toast({
        variant: "destructive",
        title: "Không có dữ liệu",
        description: "Không có dữ liệu để xuất file CSV.",
      });
      return;
    }

    exportCustomerReportCSV(mappedData as any, 0); // Pass 0 since we're not using bonusRate anymore
    toast({
      title: "Export Successful",
      description: "Division report has been successfully exported as a CSV file.",
    });
  };

  // Calculate totals - using bonusValue from data instead of bonusRate
  const totalRevenue = groupedData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBMM = groupedData.reduce((sum, d) => sum + d.bmm, 0);
  const totalBonus = groupedData.reduce((sum, d) => sum + d.bonusValue, 0);
  const totalCost = groupedData.reduce((sum, d) => {
    const salary = d.salaryCost ?? 0;
    const bonus = d.bonusValue ?? 0; // Use bonusValue instead of calculating with rate
    const oh = d.overheadCost ?? 0;
    return sum + salary + bonus + oh;
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalProfitPercent = totalRevenue !== 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Division Report"
        description="Business performance report by division"
        icon={BarChart3}
      />
      <div className="p-6">
        <ReportSummary
          totalRevenue={totalRevenue}
          totalBMM={totalBMM}
          totalCost={totalCost}
          totalProfit={totalProfit}
          totalProfitPercent={totalProfitPercent}
        />

        <ReportFilter
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          months={MONTHS}
          years={YEARS}
          title="Filter Division Report"
        />

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Division Report
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
                  totalPages={totalPagesDivision}
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
                data={mappedData as any}
                loading={loading}
                paginatedData={mappedData as any}
                currentPage={currentPage}
                totalPages={totalPagesDivision}
                goToPage={handlePageChange}
                goToNextPage={() => { if (currentPage < totalPagesDivision) handlePageChange(currentPage + 1); }}
                goToPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1); }}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                pageSize={pageSize}
                bonusRate={0}
                companyLabel="Division"
                searchTerm={searchTerm}
                onFilteredCountChange={handleFilteredCountChange}
              />
            )}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPagesDivision}
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

export default DivisionReport;
