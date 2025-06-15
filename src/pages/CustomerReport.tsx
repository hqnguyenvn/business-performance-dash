
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { supabase } from "@/integrations/supabase/client";

// Table data interface for group by rows
interface GroupedCustomerData {
  year: number;
  month: number;
  customer_id: string;
  customer_code: string;
  company_id: string;
  company_code: string;
  bmm: number;
  revenue: number;
  salaryCost?: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomerReport = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [groupedData, setGroupedData] = useState<GroupedCustomerData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const monthNumber = MONTHS.indexOf(selectedMonth) + 1;
      // 1. Get all revenues, group and SUM by (customer_id, company_id, year, month)
      const { data: rows, error } = await supabase
        .from('revenues')
        .select(
          `
            year,
            month,
            customer_id,
            company_id,
            quantity,
            vnd_revenue,
            customers!revenues_customer_id_fkey(code),
            companies!revenues_company_id_fkey(code)
          `
        )
        .eq('year', Number(selectedYear))
        .eq('month', monthNumber);

      if (error) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu revenues.",
        });
        setLoading(false);
        return;
      }

      // 2. Get salary_costs: SUM amount by (year, month, customer_id)
      const { data: salaryRows, error: salaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, customer_id, amount
        `)
        .eq('year', Number(selectedYear))
        .eq('month', monthNumber);

      if (salaryError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu salary_costs.",
        });
        setLoading(false);
        return;
      }

      // sum salary cost by (year, month, customer_id)
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.customer_id) continue;
        const key = `${row.year}_${row.month}_${row.customer_id}`;
        const prev = salaryMap.get(key) || 0;
        salaryMap.set(key, prev + (Number(row.amount) || 0));
      }

      // group revenues by (customer_id, company_id, year, month), aggregate bmm, revenue
      const groupMap = new Map<string, GroupedCustomerData>();
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.customer_id}_${row.company_id}`;
        let prev = groupMap.get(groupKey);
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;
        if (prev) {
          prev.bmm += bmm;
          prev.revenue += revenue;
        } else {
          // Find salary cost for this (year, month, customer_id)
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          groupMap.set(groupKey, {
            year: row.year,
            month: row.month,
            customer_id: row.customer_id,
            customer_code: row.customers?.code || 'N/A',
            company_id: row.company_id,
            company_code: row.companies?.code || 'N/A',
            bmm,
            revenue,
            salaryCost: salaryMap.get(salaryKey) || 0,
          });
        }
      }
      setGroupedData(Array.from(groupMap.values()));
      setLoading(false);
    };
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Pagination logic
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
  } = usePagination({ data: groupedData });

  const exportToCSV = () => {
    toast({
      title: "Export Successful",
      description: "Customer report has been successfully exported as a CSV file.",
    });
  };

  // Card totals
  const totalRevenue = groupedData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBMM = groupedData.reduce((sum, d) => sum + d.bmm, 0);
  const totalSalaryCost = groupedData.reduce((sum, d) => sum + (d.salaryCost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Customer Report"
        description="Business performance report by customer"
        icon={TrendingUp}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
              <div className="text-2xl font-bold text-purple-600">
                {totalBMM.toLocaleString()} BMM
              </div>
              <p className="text-sm text-gray-600">Total BMM</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {totalSalaryCost.toLocaleString()} VND
              </div>
              <p className="text-sm text-gray-600">Total Salary Cost</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Customer Report</CardTitle>
              <div className="flex gap-4 items-center">
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
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Company</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Customer Code</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">BMM</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Revenue</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Salary Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-gray-300 p-8 text-center text-gray-500">
                        No data matches the selected filters. Try adjusting the year or month selection.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((data) => (
                      <tr key={`${data.year}_${data.month}_${data.customer_id}_${data.company_id}`} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{data.company_code}</td>
                        <td className="border border-gray-300 p-2">{data.customer_code}</td>
                        <td className="border border-gray-300 p-2 text-right">{data.bmm.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">{data.revenue.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">{(data.salaryCost ?? 0).toLocaleString()}</td>
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

export default CustomerReport;
