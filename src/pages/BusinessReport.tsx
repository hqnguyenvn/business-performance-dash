
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
      title: "Xuất báo cáo",
      description: "Đã xuất báo cáo kinh doanh ra file CSV thành công",
    });
  };

  const totalRevenue = businessData.reduce((sum, data) => sum + data.revenue, 0);
  const totalNetProfit = businessData.reduce((sum, data) => sum + data.netProfit, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Báo cáo Kết quả Kinh doanh"
        description="Báo cáo tổng hợp theo năm và tháng"
        icon={BarChart3}
        actions={
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
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
                <p className="text-sm text-gray-600">Tổng Doanh thu năm {selectedYear}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {totalNetProfit.toLocaleString()} VND
                </div>
                <p className="text-sm text-gray-600">Tổng Lợi nhuận ròng</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">Năm:</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Năm" />
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
                <label className="text-sm font-medium mb-2 block">Thuế TNDN:</label>
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
            <CardTitle>Báo cáo Chi tiết</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Tháng</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Doanh thu</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Chi phí</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">LN gốc</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Thuế TNDN</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Bonus</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Tổng CP</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">LN ròng</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">% LN gốc</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">% LN ròng</th>
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
