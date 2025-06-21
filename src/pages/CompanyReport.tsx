
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportSummary } from "@/components/customer-report/ReportSummary";
import { ReportTable } from "@/components/customer-report/ReportTable";
import { exportCustomerReportCSV } from "@/utils/customerReportExport";
import { useCompanyReportData, MONTHS, YEARS, GroupedCompanyData } from "@/hooks/useCompanyReportData";

const CompanyReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: currentMonth }, (_, i) => i + 1)
  );
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

  // Callback để nhận dữ liệu đã filter từ ReportTable
  const handleFilteredDataChange = (filtered: any[]) => {
    setTableFilteredData(filtered as GroupedCompanyData[]);
  };

  // Callback để nhận totals từ ReportTable
  const handleTotalsChange = (newTotals: typeof totals) => {
    setTotals(newTotals);
  };

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

  // Use totals directly from state (calculated in ReportTable)
  const {
    totalRevenue,
    totalBMM, 
    totalBonus,
    totalCost,
    totalProfit,
    totalProfitPercent
  } = totals;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Company Report"
        description="Business performance report by company"
        icon={Building}
      />
      <div className="p-6">
        <ReportSummary
          totalRevenue={totalRevenue}
          totalBMM={totalBMM}
          totalCost={totalCost}
          totalProfit={totalProfit}
          totalProfitPercent={totalProfitPercent}
        />

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                Company Report
                {isDataLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <ReportFilter
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonths={selectedMonths}
                setSelectedMonths={setSelectedMonths}
                months={MONTHS}
                years={YEARS}
                onExport={exportToCSV}
              />
            </div>
          </CardHeader>
          <CardContent>
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
                currentPage={1}
                totalPages={1}
                goToPage={() => {}}
                goToNextPage={() => {}}
                goToPreviousPage={() => {}}
                totalItems={groupedData.length}
                startIndex={1}
                endIndex={groupedData.length}
                bonusRate={0}
                companyLabel="Company"
                onFilteredDataChange={handleFilteredDataChange}
                onTotalsChange={handleTotalsChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyReport;
