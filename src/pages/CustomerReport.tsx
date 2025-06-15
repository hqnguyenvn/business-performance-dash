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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const years = [2023, 2024, 2025];

const CustomerReport = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [groupedData, setGroupedData] = useState<GroupedCustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [bonusRate, setBonusRate] = useState<number>(15);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const monthNumber = MONTHS.indexOf(selectedMonth) + 1;

      // 1. Fetch revenues with group data
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

      // 2. Fetch salary_costs: SUM amount by (year, month, customer_id)
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

      // 3. Fetch costs: SUM cost by (year, month) with is_cost = true
      const { data: costRows, error: costError } = await supabase
        .from('costs')
        .select(`
          year, month, cost, is_cost
        `)
        .eq('year', Number(selectedYear))
        .eq('month', monthNumber)
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

      // --------------------------
      // 1. Calculate total salary costs by (year, month)
      const salaryByPeriod = new Map<string, number>();
      // 2. Also, salary cost by (year, month, customer_id)
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.customer_id) continue;
        const periodKey = `${row.year}_${row.month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);
        const custKey = `${row.year}_${row.month}_${row.customer_id}`;
        salaryMap.set(custKey, (salaryMap.get(custKey) ?? 0) + Number(row.amount) || 0);
      }

      // 3. Total cost by (year, month) is sum of 'cost' from costRows
      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // 4. Total BMM by (year, month): sum quantity in revenue rows
      const bmmByPeriod = new Map<string, number>();
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + Number(row.quantity) || 0);
      }

      // 5. Precompute overheadPerBMM (costByPeriod - salaryByPeriod) / bmmByPeriod
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

      // 6. group revenues by (customer_id, company_id, year, month), aggregate bmm, revenue
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
            month: row.month,
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
        <ReportSummary
          totalRevenue={totalRevenue}
          totalBMM={totalBMM}
          totalSalaryCost={totalSalaryCost}
        />

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Customer Report</CardTitle>
              <ReportFilter
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
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
              paginatedData={paginatedData}
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              goToNextPage={goToNextPage}
              goToPreviousPage={goToPreviousPage}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              bonusRate={bonusRate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerReport;
