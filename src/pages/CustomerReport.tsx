
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerData {
  customerID: string;
  company: string;
  bmm: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomerReport = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("Jan");

  // Mock data for demonstration
  const customerData: CustomerData[] = [
    {
      customerID: "CUST001",
      company: "Công ty ABC Technology",
      bmm: 12.5,
      revenue: 500000000,
      cost: 300000000,
      profit: 200000000,
      profitMargin: 40,
    },
    {
      customerID: "CUST002",
      company: "XYZ Solutions Ltd",
      bmm: 8.0,
      revenue: 320000000,
      cost: 200000000,
      profit: 120000000,
      profitMargin: 37.5,
    },
    {
      customerID: "CUST003",
      company: "DEF Software Inc",
      bmm: 15.2,
      revenue: 680000000,
      cost: 420000000,
      profit: 260000000,
      profitMargin: 38.2,
    },
    {
      customerID: "CUST004",
      company: "GHI Digital Corp",
      bmm: 6.8,
      revenue: 280000000,
      cost: 180000000,
      profit: 100000000,
      profitMargin: 35.7,
    },
    {
      customerID: "CUST005",
      company: "JKL Systems Pte",
      bmm: 10.3,
      revenue: 450000000,
      cost: 270000000,
      profit: 180000000,
      profitMargin: 40,
    },
  ];

  const exportToCSV = () => {
    toast({
      title: "Xuất báo cáo",
      description: "Đã xuất báo cáo khách hàng ra file CSV thành công",
    });
  };

  const totalRevenue = customerData.reduce((sum, data) => sum + data.revenue, 0);
  const totalProfit = customerData.reduce((sum, data) => sum + data.profit, 0);
  const totalBMM = customerData.reduce((sum, data) => sum + data.bmm, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Báo cáo Khách hàng"
        description="Báo cáo kết quả kinh doanh theo khách hàng"
        icon={TrendingUp}
        actions={
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {totalRevenue.toLocaleString()} VND
              </div>
              <p className="text-sm text-gray-600">Tổng Doanh thu</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {totalProfit.toLocaleString()} VND
              </div>
              <p className="text-sm text-gray-600">Tổng Lợi nhuận</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {totalBMM.toFixed(1)} BMM
              </div>
              <p className="text-sm text-gray-600">Tổng BMM</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Báo cáo theo Khách hàng</CardTitle>
              <div className="flex gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Mã KH</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Công ty</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">BMM</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Doanh thu</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Chi phí</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Lợi nhuận</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">% Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {customerData.map((data) => (
                    <tr key={data.customerID} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">{data.customerID}</td>
                      <td className="border border-gray-300 p-2">{data.company}</td>
                      <td className="border border-gray-300 p-2 text-right">{data.bmm}</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.revenue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.cost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right text-green-600 font-medium">
                        {data.profit.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.profitMargin.toFixed(1)}%
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

export default CustomerReport;
