
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
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

  const { groupedData, loading } = useCompanyReportData({
    selectedYear,
    selectedMonths
  });

  // Callback để nhận dữ liệu đã filter từ ReportTable
  const handleFilteredDataChange = (filtered: any[]) => {
    console.log('📥 CompanyReport: Received filtered data, length =', filtered.length);
    setTableFilteredData(filtered as GroupedCompanyData[]);
  };

  const exportToCSV = () => {
    exportCustomerReportCSV(groupedData as any, 0); // Pass 0 since we're not using bonusRate anymore
    toast({
      title: "Export Successful",
      description: "Company report has been successfully exported as a CSV file.",
    });
  };

  // Calculate totals using useMemo to ensure re-calculation when data changes
  const {
    totalRevenue,
    totalBMM, 
    totalBonus,
    totalCost,
    totalProfit,
    totalProfitPercent
  } = useMemo(() => {
    // Use tableFilteredData if it has data, otherwise use original groupedData
    const dataToCalculate = tableFilteredData.length > 0 ? tableFilteredData : groupedData;
    console.log('💰 CompanyReport: Calculating totals from', dataToCalculate.length, 'filtered records');
    
    const revenue = dataToCalculate.reduce((sum, d) => sum + d.revenue, 0);
    const bmm = dataToCalculate.reduce((sum, d) => sum + d.bmm, 0);
    const bonus = dataToCalculate.reduce((sum, d) => sum + d.bonusValue, 0);
    const cost = dataToCalculate.reduce((sum, d) => {
      const salary = d.salaryCost ?? 0;
      const bonusVal = d.bonusValue ?? 0;
      const oh = d.overheadCost ?? 0;
      return sum + salary + bonusVal + oh;
    }, 0);
    const profit = revenue - cost;
    const profitPercent = revenue !== 0 ? (profit / revenue) * 100 : 0;

    console.log('📊 CompanyReport: Calculated totals -', {
      records: dataToCalculate.length,
      revenue: Math.round(revenue).toLocaleString(),
      bmm: bmm,
      cost: Math.round(cost).toLocaleString()
    });

    return {
      totalRevenue: revenue,
      totalBMM: bmm,
      totalBonus: bonus,
      totalCost: cost,
      totalProfit: profit,
      totalProfitPercent: profitPercent
    };
  }, [tableFilteredData, groupedData, tableFilteredData.length]);

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
              <CardTitle>Company Report</CardTitle>
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
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyReport;
