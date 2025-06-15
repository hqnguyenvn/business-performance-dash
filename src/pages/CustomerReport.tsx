import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { supabase } from "@/integrations/supabase/client";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportTable, GroupedCustomerData } from "@/components/customer-report/ReportTable";
import { ReportSummary } from "@/components/customer-report/ReportSummary";
import { exportCustomerReportCSV } from "@/utils/customerReportExport";

// Define month info for filtering & display
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
  { value: 12, label: "December", short: "Dec" },
];
const years = [2023, 2024, 2025];

const CustomerReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  // --- Year, months state (multi-checkbox)
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(Array.from({ length: currentMonth }, (_, i) => i + 1));
  const [groupedData, setGroupedData] = useState<GroupedCustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [bonusRate, setBonusRate] = useState<number>(15);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch revenues with group data for all months selected
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
        .in('month', selectedMonths);

      if (error) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu revenues.",
        });
        setLoading(false);
        return;
      }

      // 2. Fetch salary_costs: SUM amount by (year, month, customer_id)
      const { data: salaryRows, error: salaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, customer_id, amount
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths);

      if (salaryError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu salary_costs.",
        });
        setLoading(false);
        return;
      }

      // 3. Fetch costs: SUM cost by (year, month) with is_cost = true
      const { data: costRows, error: costError } = await supabase
        .from('costs')
        .select(`
          year, month, cost, is_cost
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths)
        .eq('is_cost', true);

      if (costError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu costs.",
        });
        setLoading(false);
        return;
      }

      // Aggregation per filter

      const salaryByPeriod = new Map<string, number>();
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.customer_id) continue;
        const periodKey = `${row.year}_${row.month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);
        const custKey = `${row.year}_${row.month}_${row.customer_id}`;
        salaryMap.set(custKey, (salaryMap.get(custKey) ?? 0) + Number(row.amount) || 0);
      }

      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      const bmmByPeriod = new Map<string, number>();
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + Number(row.quantity) || 0);
      }

      const overheadPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey, totalCost] of costByPeriod.entries()) {
        const salaryCost = salaryByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        let overhead = 0;
        if (totalBmm !== 0) {
          overhead = (totalCost - salaryCost) / totalBmm;
        }
        overheadPerBMMByPeriod.set(periodKey, overhead);
      }

      // --- GROUP: by (customer_id, company_id, year, month), aggregate bmm, revenue
      const groupMap = new Map<string, GroupedCustomerData>();
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.customer_id}_${row.company_id}`;
        let prev = groupMap.get(groupKey);
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;

        const periodKey = `${row.year}_${row.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const overheadCost = overheadPerBMM * bmm;

        if (prev) {
          prev.bmm += bmm;
          prev.revenue += revenue;
          prev.overheadCost += overheadCost;
        } else {
          // Find salary cost for this (year, month, customer_id)
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          groupMap.set(groupKey, {
            year: row.year,
            month: row.month, // integer 1-12
            customer_id: row.customer_id,
            customer_code: row.customers?.code || 'N/A',
            company_id: row.company_id,
            company_code: row.companies?.code || 'N/A',
            bmm,
            revenue,
            salaryCost: salaryMap.get(salaryKey) || 0,
            overheadCost,
          });
        }
      }

      // --- Build result array, sorted by month, company_code, customer_code ---
      const resultArr = Array.from(groupMap.values());
      resultArr.sort((a, b) => {
        // Sort by month ASC, then company_code ASC, then customer_code ASC
        if (a.month !== b.month) return a.month - b.month;
        if (a.company_code !== b.company_code) return a.company_code.localeCompare(b.company_code);
        return a.customer_code.localeCompare(b.customer_code);
      });
      setGroupedData(resultArr);
      setLoading(false);
    };
    fetchData();
  }, [selectedYear, selectedMonths]);

  // XÓA hoàn toàn paging
  // Pagination logic đã bị loại bỏ
  // Sử dụng toàn bộ groupedData cho bảng
  // Không dùng usePagination nữa

  const exportToCSV = () => {
    exportCustomerReportCSV(groupedData, bonusRate);
    toast({
      title: "Export Successful",
      description: "Customer report has been successfully exported as a CSV file.",
    });
  };

  // Card totals
  const totalRevenue = groupedData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBMM = groupedData.reduce((sum, d) => sum + d.bmm, 0);

  // Tính tổng Total Cost (salaryCost + bonus + overhead)
  const totalCost = groupedData.reduce((sum, d) => {
    const salary = d.salaryCost ?? 0;
    const bonus = (salary * bonusRate) / 100;
    const oh = d.overheadCost ?? 0;
    return sum + salary + bonus + oh;
  }, 0);

  // Tổng profit, %profit
  const totalProfit = totalRevenue - totalCost;
  const totalProfitPercent = totalRevenue !== 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Customer Report"
        description="Business performance report by customer"
        icon={TrendingUp}
      />

      <div className="p-6">
        {/* Sửa lại, truyền đủ các props mới */}
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
              <CardTitle>Customer Report</CardTitle>
              <ReportFilter
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonths={selectedMonths}
                setSelectedMonths={setSelectedMonths}
                months={MONTHS}
                years={years}
                onExport={exportToCSV}
                bonusRate={bonusRate}
                setBonusRate={setBonusRate}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ReportTable
              data={groupedData}
              loading={loading}
              paginatedData={groupedData}
              currentPage={1}
              totalPages={1}
              goToPage={() => {}}
              goToNextPage={() => {}}
              goToPreviousPage={() => {}}
              totalItems={groupedData.length}
              startIndex={1}
              endIndex={groupedData.length}
              bonusRate={bonusRate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerReport;
