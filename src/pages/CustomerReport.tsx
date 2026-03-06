
import { useEffect, useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParameterValues } from "@/hooks/useParameterValues";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportTable } from "@/components/customer-report/ReportTable";
import { ReportSummary } from "@/components/customer-report/ReportSummary";
import { exportCustomerReportCSV } from "@/utils/customerReportExport";
import PaginationControls from "@/components/PaginationControls";

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
const currentYearValue = new Date().getFullYear();
const years = Array.from({ length: currentYearValue - 2023 + 1 }, (_, i) => 2023 + i);

interface CustomerReportData {
  year: number;
  month: number;
  customer_id: string;
  customer_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number;
}

const CustomerReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(Array.from({ length: Math.max(currentMonth - 1, 0) }, (_, i) => i + 1));
  const [groupedData, setGroupedData] = useState<CustomerReportData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [filteredCount, setFilteredCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [tableFilteredData, setTableFilteredData] = useState<CustomerReportData[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalBMM: 0,
    totalBonus: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPercent: 0
  });

  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  const handleFilteredDataChange = useCallback((filtered: CustomerReportData[]) => {
    setTableFilteredData(filtered);
  }, []);

  const handleTotalsChange = useCallback((newTotals: typeof totals) => {
    setTotals(newTotals);
  }, []);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredCount(count);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number | 'all') => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const totalItems = filteredCount;
  const effectivePageSize = typeof pageSize === 'number' ? pageSize : totalItems;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / (effectivePageSize || 1));
  const startIndex = totalItems > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [
        { data: rows, error },
        { data: salaryRows, error: salaryError },
        { data: costRows, error: costError },
        { data: costTypes, error: costTypesError },
        { data: bonusRows, error: bonusError },
        { data: customers, error: customersError }
      ] = await Promise.all([
        // 1. Revenues
        supabase
          .from('revenues')
          .select(`
            year, month, customer_id, company_id, quantity, vnd_revenue,
            customers!revenues_customer_id_fkey(code)
          `)
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths),

        // 2. Salary costs (with customer_id)
        supabase
          .from('salary_costs')
          .select('year, month, customer_id, amount')
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths),

        // 3. Costs (is_cost = true)
        supabase
          .from('costs')
          .select('year, month, cost, is_cost')
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths)
          .eq('is_cost', true),

        // 4. Cost types to find "Salary" type
        supabase
          .from('cost_types')
          .select('id, name, code')
          .eq('code', 'Salary'),

        // 5. Bonus by company
        supabase
          .from('bonus_by_c')
          .select('year, company_id, bn_bmm')
          .eq('year', Number(selectedYear)),

        // 6. Customers
        supabase
          .from('customers')
          .select('id, code, name')
      ]);

      if (error || salaryError || costError || costTypesError || bonusError || customersError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu báo cáo.",
        });
        setLoading(false);
        return;
      }

      const salaryTypeId = costTypes?.[0]?.id;

      // Fetch salary costs from costs table with cost_type = "Salary"
      let salaryCostRows: any[] = [];
      if (salaryTypeId) {
        const { data: salaryFromCosts, error: salaryFromCostsError } = await supabase
          .from('costs')
          .select('year, month, cost')
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths)
          .eq('cost_type', salaryTypeId);

        if (salaryFromCostsError) {
          toast({ variant: "destructive", title: "Lỗi", description: "Không lấy được salary costs từ bảng costs." });
          setLoading(false);
          return;
        }
        salaryCostRows = salaryFromCosts || [];
      }

      // === Aggregation maps ===

      // Total cost by period
      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const k = `${row.year}_${row.month}`;
        costByPeriod.set(k, (costByPeriod.get(k) ?? 0) + (Number(row.cost) || 0));
      }

      // Total salary (from salary_costs) by period
      const salaryByPeriod = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        const k = `${row.year}_${row.month}`;
        salaryByPeriod.set(k, (salaryByPeriod.get(k) ?? 0) + (Number(row.amount) || 0));
      }

      // Salary cost from costs table (cost_type=Salary) by period
      const salaryCostByPeriod = new Map<string, number>();
      for (const row of salaryCostRows) {
        const k = `${row.year}_${row.month}`;
        salaryCostByPeriod.set(k, (salaryCostByPeriod.get(k) ?? 0) + (Number(row.cost) || 0));
      }

      // Revenue & BMM by period
      const revenueByPeriod = new Map<string, number>();
      const bmmByPeriod = new Map<string, number>();
      const bmmByPeriodCompany = new Map<string, number>();
      for (const row of rows ?? []) {
        const k = `${row.year}_${row.month}`;
        revenueByPeriod.set(k, (revenueByPeriod.get(k) ?? 0) + (Number(row.vnd_revenue) || 0));
        bmmByPeriod.set(k, (bmmByPeriod.get(k) ?? 0) + (Number(row.quantity) || 0));
        const kc = `${row.year}_${row.month}_${row.company_id}`;
        bmmByPeriodCompany.set(kc, (bmmByPeriodCompany.get(kc) ?? 0) + (Number(row.quantity) || 0));
      }

      // Salary map by (year, month, customer_id) from salary_costs table
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (row.customer_id) {
          const k = `${row.year}_${row.month}_${row.customer_id}`;
          salaryMap.set(k, (salaryMap.get(k) ?? 0) + (Number(row.amount) || 0));
        }
      }

      // Bonus map by company_id
      const bonusMap = new Map<string, number>();
      for (const row of bonusRows ?? []) {
        bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
      }

      // salaryBonus by period (sum of BMM * bn_bmm for each company)
      const salaryBonusByPeriod = new Map<string, number>();
      for (const [periodKey] of bmmByPeriod.entries()) {
        let totalSalaryBonus = 0;
        for (const [periodCompanyKey, bmm] of bmmByPeriodCompany.entries()) {
          if (periodCompanyKey.startsWith(periodKey + '_')) {
            const companyId = periodCompanyKey.replace(periodKey + '_', '');
            const bnBmm = bonusRows?.find(b => b.company_id === companyId)?.bn_bmm || 0;
            totalSalaryBonus += bmm * bnBmm;
          }
        }
        salaryBonusByPeriod.set(periodKey, totalSalaryBonus);
      }

      // Build set of customer_ids that have revenue in each period
      const customersWithRevenueByPeriod = new Map<string, Set<string>>();
      for (const row of rows ?? []) {
        const k = `${row.year}_${row.month}`;
        if (!customersWithRevenueByPeriod.has(k)) {
          customersWithRevenueByPeriod.set(k, new Set());
        }
        if (row.customer_id) {
          customersWithRevenueByPeriod.get(k)!.add(row.customer_id);
        }
      }

      // Customer cost (customer_id not null) by period from salary_costs
      // Only include costs for customers that have revenue in that period
      const customerCostByPeriod = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (row.customer_id) {
          const k = `${row.year}_${row.month}`;
          const customersWithRevenue = customersWithRevenueByPeriod.get(k);
          if (customersWithRevenue && customersWithRevenue.has(row.customer_id)) {
            customerCostByPeriod.set(k, (customerCostByPeriod.get(k) ?? 0) + (Number(row.amount) || 0));
          }
        }
      }

      // Overhead per BMM by period
      const overheadPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey, totalCostFromCosts] of costByPeriod.entries()) {
        const customerCost = customerCostByPeriod.get(periodKey) ?? 0;
        const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const tax = taxRate * (totalRevenue - totalCostFromCosts);

        let overhead = 0;
        if (totalBmm !== 0) {
          overhead = (totalCostFromCosts + tax - customerCost) / totalBmm;
        }
        overheadPerBMMByPeriod.set(periodKey, overhead);
      }

      // === Bonus per BMM by period ===
      // Bonus = (Salary cost from costs table * bonusRate) / totalBMM * customerBMM
      const avgBonusPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey] of bmmByPeriod.entries()) {
        const salaryCostFromCosts = salaryCostByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const avgBonus = totalBmm !== 0 ? (salaryCostFromCosts * bonusRate) / totalBmm : 0;
        avgBonusPerBMMByPeriod.set(periodKey, avgBonus);
      }

      // === GROUP by (year, month, customer_id) — no company dimension ===
      const groupMap = new Map<string, CustomerReportData>();
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.customer_id}`;
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;
        const periodKey = `${row.year}_${row.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const avgBonusPerBMM = avgBonusPerBMMByPeriod.get(periodKey) ?? 0;

        const prev = groupMap.get(groupKey);
        if (prev) {
          prev.bmm += bmm;
          prev.revenue += revenue;
          prev.overheadCost += overheadPerBMM * bmm;
          prev.bonusValue += avgBonusPerBMM * bmm;
        } else {
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          const salaryCost = salaryMap.get(salaryKey) || 0;

          groupMap.set(groupKey, {
            year: row.year,
            month: row.month,
            customer_id: row.customer_id,
            customer_code: row.customers?.code || 'N/A',
            bmm,
            revenue,
            salaryCost,
            overheadCost: overheadPerBMM * bmm,
            bonusValue: avgBonusPerBMM * bmm,
          });
        }
      }

      const resultArr = Array.from(groupMap.values());
      resultArr.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.customer_code.localeCompare(b.customer_code);
      });
      setGroupedData(resultArr);
      setLoading(false);
    };
    fetchData();
  }, [selectedYear, selectedMonths, bonusRate, taxRate]);

  const exportToCSV = () => {
    exportCustomerReportCSV(tableFilteredData.length > 0 ? tableFilteredData as any : groupedData as any, 0);
    toast({
      title: "Export Successful",
      description: "Customer report has been successfully exported as a CSV file.",
    });
  };

  const { totalRevenue, totalBMM, totalBonus, totalCost, totalProfit, totalProfitPercent } = totals;

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
          totalCost={totalCost}
          totalProfit={totalProfit}
          totalProfitPercent={totalProfitPercent}
        />

        <ReportFilter
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          months={MONTHS}
          years={years}
          title="Filter Customer Report"
        />

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Customer Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <div className="flex gap-2 md:w-1/3">
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setSearchTerm(searchTerm)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  position="top"
                />
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            <ReportTable
              data={groupedData as any}
              loading={loading}
              paginatedData={groupedData as any}
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={handlePageChange}
              goToNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
              goToPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1); }}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={pageSize}
              bonusRate={0}
              searchTerm={searchTerm}
              onFilteredDataChange={handleFilteredDataChange}
              onTotalsChange={handleTotalsChange}
              onFilteredCountChange={handleFilteredCountChange}
              hideCompanyColumn={true}
            />
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={pageSize}
              position="bottom"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerReport;
