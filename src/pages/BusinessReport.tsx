
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BusinessData {
  year: number;
  month: string;
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BusinessReport = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(5);
  const [bonusRate, setBonusRate] = useState<number>(15);

  // Mock data for demonstration
  const businessData: BusinessData[] = MONTHS.map((month, index) => {
    const revenue = (Math.random() * 500 + 200) * 1000000; // 200-700M VND
    const cost = revenue * (0.6 + Math.random() * 0.2); // 60-80% of revenue
    const grossProfit = revenue - cost;
    const incomeTax = grossProfit * (incomeTaxRate / 100);
    const bonus = cost * 0.3 * (bonusRate / 100); // Assume 30% of cost is salary
    const totalCost = cost + incomeTax + bonus;
    const netProfit = revenue - totalCost;
    
    return {
      year: parseInt(selectedYear),
      month,
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

  const exportToCSV = () => {
    toast({
      title: "Export report",
      description: "Business report has been exported to CSV file successfully",
    });
  };

  const totalRevenue = businessData.reduce((sum, data) => sum + data.revenue, 0);
  const totalNetProfit = businessData.reduce((sum, data) => sum + data.netProfit, 0);

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
        {/* Summary Cards and Filters in optimized layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {totalRevenue.toLocaleString()} VND
                </div>
                <p className="text-sm text-gray-600">Total Revenue {selectedYear}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {totalNetProfit.toLocaleString()} VND
                </div>
                <p className="text-sm text-gray-600">Total Net Profit</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">Year:</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">Income Tax:</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={incomeTaxRate}
                    onChange={(e) => setIncomeTaxRate(parseFloat(e.target.value) || 5)}
                    className="flex-1"
                  />
                  <span className="text-sm">%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">Bonus:</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={bonusRate}
                    onChange={(e) => setBonusRate(parseFloat(e.target.value) || 15)}
                    className="flex-1"
                  />
                  <span className="text-sm">%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Detailed Report</CardTitle>
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
                  {businessData.map((data) => (
                    <tr key={data.month} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">{data.month}</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.revenue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.cost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right text-green-600">
                        {data.grossProfit.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.incomeTax.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.bonus.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.totalCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right text-blue-600 font-medium">
                        {data.netProfit.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.grossProfitPercent.toFixed(1)}%
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.netProfitPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessReport;
