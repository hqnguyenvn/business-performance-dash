
import { useBusinessReport } from "@/hooks/useBusinessReport";
import { BusinessReportHeader } from "@/components/business-report/BusinessReportHeader";
import { BusinessReportFilters } from "@/components/business-report/BusinessReportFilters";
import { BusinessReportSummary } from "@/components/business-report/BusinessReportSummary";
import { BusinessReportTable } from "@/components/business-report/BusinessReportTable";

const BusinessReport = () => {
  const {
    loading,
    selectedYear,
    availableYears,
    handleYearChange,
    selectedMonths,
    handleMonthToggle,
    incomeTaxRate,
    setIncomeTaxRate,
    bonusRate,
    setBonusRate,
    businessData,
    pagination,
    totals,
    exportToCSV,
    MONTHS,
  } = useBusinessReport();

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
      <BusinessReportHeader onExport={exportToCSV} />

      <div className="p-6">
        <BusinessReportFilters
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={handleYearChange}
          selectedMonths={selectedMonths}
          onMonthToggle={handleMonthToggle}
          incomeTaxRate={incomeTaxRate}
          onIncomeTaxRateChange={setIncomeTaxRate}
          bonusRate={bonusRate}
          onBonusRateChange={setBonusRate}
          months={MONTHS}
        />

        <BusinessReportSummary
          totalRevenue={totals.totalRevenue}
          totalGrossProfit={totals.totalGrossProfit}
          totalCost={totals.totalCost}
          totalNetProfit={totals.totalNetProfit}
          grossProfitPercent={totals.grossProfitPercent}
          netProfitPercent={totals.netProfitPercent}
          selectedYear={selectedYear}
        />

        <BusinessReportTable
          totalRecords={businessData.length}
          pagination={pagination}
        />
      </div>
    </div>
  );
};

export default BusinessReport;
