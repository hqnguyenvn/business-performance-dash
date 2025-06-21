
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParameterValues } from "@/hooks/useParameterValues";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportSummary } from "@/components/customer-report/ReportSummary";
import { ReportTable } from "@/components/customer-report/ReportTable";
import { exportCustomerReportCSV } from "@/utils/customerReportExport";
import { useDivisionReportData, MONTHS, YEARS, GroupedDivisionData } from "@/hooks/useDivisionReportData";

const DivisionReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(Array.from({ length: currentMonth }, (_, i) => i + 1));

  // Get parameter values from database
  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  const { groupedData, loading } = useDivisionReportData({
    selectedYear,
    selectedMonths
  });

  // Map dữ liệu sang format ReportTable mong muốn: company_code => division_code
  const mappedData = groupedData.map((row) => ({
    ...row,
    company_code: row.division_code, // Gắn division_code vào field company_code để tận dụng component hiện tại
    company_id: row.division_id      // Trường company_id dùng cho key và filter
  }));

  const exportToCSV = () => {
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

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Division Report</CardTitle>
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
            <ReportTable
              data={mappedData as any}
              loading={loading}
              paginatedData={mappedData as any}
              currentPage={1}
              totalPages={1}
              goToPage={() => {}}
              goToNextPage={() => {}}
              goToPreviousPage={() => {}}
              totalItems={mappedData.length}
              startIndex={1}
              endIndex={mappedData.length}
              bonusRate={0}
              companyLabel="Division"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DivisionReport;
