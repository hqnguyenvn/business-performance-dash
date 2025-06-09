
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";

interface BusinessData {
  year: number;
  month: string;
  monthNumber: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  incomeTax: number;
  bonus: number;
  totalCost: number;
  netProfit: number;
  grossProfitPercent: number;
  netProfitPercent: number;
}

const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" }
];

const BusinessReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(5);
  const [bonusRate, setBonusRate] = useState<number>(15);

  // Generate business data for all months
  const allBusinessData: BusinessData[] = MONTHS.map((month, index) => {
    const revenue = (Math.random() * 500 + 200) * 1000000; // 200-700M VND
    const cost = revenue * (0.6 + Math.random() * 0.2); // 60-80% of revenue
    const grossProfit = revenue - cost;
    const incomeTax = grossProfit * (incomeTaxRate / 100);
    const bonus = cost * 0.3 * (bonusRate / 100); // Assume 30% of cost is salary
    const totalCost = cost + incomeTax + bonus;
    const netProfit = revenue - totalCost;
    
    return {
      year: parseInt(selectedYear),
      month: month.short,
      monthNumber: month.value,
      revenue,
      cost,
      grossProfit,
      incomeTax,
      bonus,
      totalCost,
      netProfit,
      grossProfitPercent: (grossProfit / revenue) * 100,
      netProfitPercent: (netProfit / revenue) * 100,
    };
  });

  // Filter data based on selected year and months
  const businessData = allBusinessData.filter(data => {
    const yearMatch = data.year === parseInt(selectedYear);
    const monthMatch = selectedMonths.includes(data.monthNumber);
    return yearMatch && monthMatch;
  });

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination({ data: businessData });

  const exportToCSV = () => {
    toast({
      title: "Export report",
      description: "Business report has been exported to CSV file successfully",
    });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort();
      return newMonths;
    });
  };

  // Calculate totals from filtered data
  const totalRevenue = businessData.reduce((sum, data) => sum + data.revenue, 0);
  const totalGrossProfit = businessData.reduce((sum, data) => sum + data.grossProfit, 0);
  const totalCost = businessData.reduce((sum, data) => sum + data.totalCost, 0);
  const totalNetProfit = businessData.reduce((sum, data) => sum + data.netProfit, 0);
  
  // Calculate percentages
  const grossProfitPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const netProfitPercent = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Business Performance Report"
        description="Comprehensive report by year and month"
        icon={BarChart3}
        actions={
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <div className="p-6">
        {/* Data Filter */}
        <Card className="bg-white mb-6">
          <CardHeader>
            <CardTitle>Data Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-8">
                {/* Year Filter */}
                <div className="flex items-center gap-4">
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Filter */}
                <div className="flex-1">
                  <div className="grid grid-cols-6 gap-2">
                    {MONTHS.map((month) => (
                      <div key={month.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`month-${month.value}`}
                          checked={selectedMonths.includes(month.value)}
                          onCheckedChange={() => handleMonthToggle(month.value)}
                        />
                        <label 
                          htmlFor={`month-${month.value}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {month.short}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tax and Bonus Controls */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Income Tax Rate:</label>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={incomeTaxRate}
                      onChange={setIncomeTaxRate}
                      className="w-20"
                      placeholder="Tax"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Bonus Rate:</label>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={bonusRate}
                      onChange={setBonusRate}
                      className="w-20"
                      placeholder="Bonus"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 text-right">
                {formatNumber(totalRevenue)} VND
              </div>
              <p className="text-sm text-gray-600">Total Revenue {selectedYear}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 text-right">
                {formatNumber(totalGrossProfit)} VND
              </div>
              <div className="text-sm text-green-600 text-right font-medium">
                {grossProfitPercent.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Total Gross Profit</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 text-right">
                {formatNumber(totalCost)} VND
              </div>
              <p className="text-sm text-gray-600">Total Cost</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 text-right">
                {formatNumber(totalNetProfit)} VND
              </div>
              <div className="text-sm text-purple-600 text-right font-medium">
                {netProfitPercent.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Total Net Profit</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Detailed Report ({businessData.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Revenue</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Gross Profit</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Income Tax</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Bonus</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Total Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Net Profit</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Gross %</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Net %</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-gray-300 p-8 text-center text-gray-500">
                        No data matches the selected filters. Try adjusting the year or month selection.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((data) => (
                      <tr key={`${data.year}-${data.monthNumber}`} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{data.month}</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(data.revenue)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(data.cost)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right text-green-600">
                          {formatNumber(data.grossProfit)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(data.incomeTax)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(data.bonus)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(data.totalCost)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right text-blue-600 font-medium">
                          {formatNumber(data.netProfit)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {data.grossProfitPercent.toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {data.netProfitPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onNextPage={goToNextPage}
              onPreviousPage={goToPreviousPage}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessReport;
