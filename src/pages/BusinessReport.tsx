import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DetailReportData {
  year: number;
  month: string;
  company: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  otherCost: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BusinessReport = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("Jan");

  // Mock data for demonstration
  const detailReportData: DetailReportData[] = [
    {
      year: 2024,
      month: "Jan",
      company: "ABC Technology",
      bmm: 12.5,
      revenue: 500000000,
      salaryCost: 150000000,
      otherCost: 50000000,
      totalCost: 200000000,
      profit: 300000000,
      profitMargin: 60,
    },
    {
      year: 2024,
      month: "Jan",
      company: "XYZ Solutions",
      bmm: 8.0,
      revenue: 320000000,
      salaryCost: 100000000,
      otherCost: 30000000,
      totalCost: 130000000,
      profit: 190000000,
      profitMargin: 59.4,
    },
    {
      year: 2024,
      month: "Jan",
      company: "DEF Software",
      bmm: 15.2,
      revenue: 680000000,
      salaryCost: 200000000,
      otherCost: 70000000,
      totalCost: 270000000,
      profit: 410000000,
      profitMargin: 60.3,
    },
    {
      year: 2024,
      month: "Jan",
      company: "GHI Digital",
      bmm: 6.8,
      revenue: 280000000,
      salaryCost: 90000000,
      otherCost: 20000000,
      totalCost: 110000000,
      profit: 170000000,
      profitMargin: 60.7,
    },
    {
      year: 2024,
      month: "Jan",
      company: "JKL Systems",
      bmm: 10.3,
      revenue: 450000000,
      salaryCost: 140000000,
      otherCost: 40000000,
      totalCost: 180000000,
      profit: 270000000,
      profitMargin: 60,
    },
  ];

  const exportToCSV = () => {
    toast({
      title: "Export Report",
      description: "The detail business report has been exported to CSV file successfully.",
    });
  };

  const totalRevenue = detailReportData.reduce((sum, data) => sum + data.revenue, 0);
  const totalProfit = detailReportData.reduce((sum, data) => sum + data.profit, 0);
  const averageProfitMargin =
    detailReportData.reduce((sum, data) => sum + data.profitMargin, 0) / detailReportData.length;
  const totalBMM = detailReportData.reduce((sum, data) => sum + data.bmm, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Detail Report"
        description="Detailed business performance analysis"
        icon={TrendingUp}
        actions={
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {totalRevenue.toLocaleString()} VND
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {totalProfit.toLocaleString()} VND
              </div>
              <p className="text-sm text-gray-600">Total Profit</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {averageProfitMargin.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Average Profit Margin</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {totalBMM.toFixed(1)} BMM
              </div>
              <p className="text-sm text-gray-600">Total BMM</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detail Business Report</CardTitle>
              <div className="flex gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Month" />
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
                  <tr className="bg-indigo-50">
                    <th className="border border-gray-300 p-2 text-center font-medium w-16">No.</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Year</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Company</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">BMM</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Revenue</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Salary Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Other Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Total Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Profit</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Profit %</th>
                  </tr>
                </thead>
                <tbody>
                  {detailReportData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-center text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 p-2">{data.year}</td>
                      <td className="border border-gray-300 p-2">{data.month}</td>
                      <td className="border border-gray-300 p-2">{data.company}</td>
                      <td className="border border-gray-300 p-2 text-right">{data.bmm}</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.revenue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.salaryCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.otherCost.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {data.totalCost.toLocaleString()}
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

export default BusinessReport;
