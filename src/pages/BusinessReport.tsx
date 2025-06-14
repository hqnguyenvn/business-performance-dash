import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

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

interface RevenueData {
  id: string;
  year: number;
  month: number;
  vnd_revenue: number;
  [key: string]: any;
}

interface CostData {
  id: string;
  year: number;
  month: number;
  cost: number;
  cost_type: string;
  [key: string]: any;
}

interface SalaryCostData {
  id: string;
  year: number;
  month: number;
  amount: number;
  [key: string]: any;
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
  const [revenues, setRevenues] = useState<RevenueData[]>([]);
  const [costs, setCosts] = useState<CostData[]>([]);
  const [salaryCosts, setSalaryCosts] = useState<SalaryCostData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch revenues
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenues')
        .select('*');
      
      if (revenueError) {
        console.error('Error fetching revenues:', revenueError);
        toast({
          title: "Error",
          description: "Failed to fetch revenue data",
          variant: "destructive"
        });
      } else {
        console.log('Fetched revenues:', revenueData);
        setRevenues(revenueData || []);
      }

      // Fetch costs
      const { data: costData, error: costError } = await supabase
        .from('costs')
        .select('*');
      
      if (costError) {
        console.error('Error fetching costs:', costError);
        toast({
          title: "Error", 
          description: "Failed to fetch cost data",
          variant: "destructive"
        });
      } else {
        console.log('Fetched costs:', costData);
        setCosts(costData || []);
      }

      // Fetch salary costs
      const { data: salaryData, error: salaryError } = await supabase
        .from('salary_costs')
        .select('*');
      
      if (salaryError) {
        console.error('Error fetching salary costs:', salaryError);
        toast({
          title: "Error",
          description: "Failed to fetch salary cost data", 
          variant: "destructive"
        });
      } else {
        console.log('Fetched salary costs:', salaryData);
        setSalaryCosts(salaryData || []);
      }

      // Calculate available years
      const revenueYears = revenueData?.map(r => r.year) || [];
      const costYears = costData?.map(c => c.year) || [];
      const salaryYears = salaryData?.map(s => s.year) || [];
      const allYears = Array.from(new Set([...revenueYears, ...costYears, ...salaryYears, currentYear])).sort((a, b) => b - a);
      setAvailableYears(allYears);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate business data from database data
  const generateBusinessData = (): BusinessData[] => {
    const businessDataMap = new Map<string, BusinessData>();

    console.log('Generating business data for year:', selectedYear);
    console.log('Available revenues:', revenues.length);
    console.log('Available costs:', costs.length);
    console.log('Available salary costs:', salaryCosts.length);

    // Initialize all months for the selected year
    MONTHS.forEach(month => {
      const key = `${selectedYear}-${month.value}`;
      businessDataMap.set(key, {
        year: parseInt(selectedYear),
        month: month.short,
        monthNumber: month.value,
        revenue: 0,
        cost: 0,
        grossProfit: 0,
        incomeTax: 0,
        bonus: 0,
        totalCost: 0,
        netProfit: 0,
        grossProfitPercent: 0,
        netProfitPercent: 0,
      });
    });

    // Aggregate revenue data
    const filteredRevenues = revenues.filter(revenue => revenue.year === parseInt(selectedYear));
    console.log('Filtered revenues for year', selectedYear, ':', filteredRevenues);
    
    filteredRevenues.forEach(revenue => {
      const key = `${revenue.year}-${revenue.month}`;
      const existing = businessDataMap.get(key);
      if (existing) {
        existing.revenue += revenue.vnd_revenue || 0;
        console.log(`Added revenue ${revenue.vnd_revenue} for ${key}, total: ${existing.revenue}`);
      }
    });

    // Aggregate cost data
    const filteredCosts = costs.filter(cost => cost.year === parseInt(selectedYear));
    console.log('Filtered costs for year', selectedYear, ':', filteredCosts);
    
    filteredCosts.forEach(cost => {
      const key = `${cost.year}-${cost.month}`;
      const existing = businessDataMap.get(key);
      if (existing) {
        existing.cost += cost.cost || 0;
        console.log(`Added cost ${cost.cost} for ${key}, total: ${existing.cost}`);
      }
    });

    // Calculate derived values
    Array.from(businessDataMap.values()).forEach(data => {
      data.grossProfit = data.revenue - data.cost;
      
      // Income Tax = 0 if Gross Profit < 0, otherwise apply tax rate
      data.incomeTax = data.grossProfit < 0 ? 0 : data.grossProfit * (incomeTaxRate / 100);
      
      // Calculate bonus based on salary costs
      const monthlySalaryCosts = salaryCosts.filter(salary => 
        salary.year === data.year && 
        salary.month === data.monthNumber
      );
      const totalSalaryCost = monthlySalaryCosts.reduce((sum, salary) => sum + (salary.amount || 0), 0);
      data.bonus = totalSalaryCost * (bonusRate / 100);
      
      data.totalCost = data.cost + data.incomeTax + data.bonus;
      data.netProfit = data.revenue - data.totalCost;
      data.grossProfitPercent = data.revenue > 0 ? (data.grossProfit / data.revenue) * 100 : 0;
      data.netProfitPercent = data.revenue > 0 ? (data.netProfit / data.revenue) * 100 : 0;
      
      console.log(`Calculations for ${data.month}:`, {
        revenue: data.revenue,
        cost: data.cost,
        grossProfit: data.grossProfit,
        incomeTax: data.incomeTax,
        totalSalaryCost,
        bonus: data.bonus,
        totalCost: data.totalCost,
        netProfit: data.netProfit
      });
    });

    return Array.from(businessDataMap.values()).sort((a, b) => a.monthNumber - b.monthNumber);
  };

  const allBusinessData = generateBusinessData();

  // Filter data based on selected months
  const businessData = allBusinessData.filter(data => 
    selectedMonths.includes(data.monthNumber)
  );

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
                      {availableYears.map(year => (
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
                {formatNumber(grossProfitPercent)}%
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
                {formatNumber(netProfitPercent)}%
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
                          {formatNumber(data.grossProfitPercent)}%
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(data.netProfitPercent)}%
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
