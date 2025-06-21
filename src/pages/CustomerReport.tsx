
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParameterValues } from "@/hooks/useParameterValues";
import { ReportFilter } from "@/components/customer-report/ReportFilter";
import { ReportTable } from "@/components/customer-report/ReportTable";
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

interface CustomerReportData {
  year: number;
  month: number;
  company_id: string;
  customer_id: string;
  company_code: string;
  customer_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number; // Thêm field bonusValue
}

const CustomerReport = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  // --- Year, months state (multi-checkbox)
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(Array.from({ length: currentMonth }, (_, i) => i + 1));
  const [groupedData, setGroupedData] = useState<CustomerReportData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State to track filtered data and totals from ReportTable
  const [tableFilteredData, setTableFilteredData] = useState<CustomerReportData[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalBMM: 0,
    totalBonus: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitPercent: 0
  });

  // Get parameter values from database
  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  // Callback để nhận dữ liệu đã filter từ ReportTable
  const handleFilteredDataChange = (filtered: CustomerReportData[]) => {
    setTableFilteredData(filtered);
  };

  // Callback để nhận totals từ ReportTable
  const handleTotalsChange = (newTotals: typeof totals) => {
    setTotals(newTotals);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Execute all queries in parallel for better performance
      const [
        { data: rows, error },
        { data: salaryRows, error: salaryError },
        { data: costRows, error: costError },
        { data: costTypes, error: costTypesError },
        { data: salaryWithoutCustomerRows, error: salaryWithoutCustomerError },
        { data: bonusRows, error: bonusError },
        { data: customers, error: customersError },
        { data: companies, error: companiesError }
      ] = await Promise.all([
        // 1. Fetch revenues with group data for all months selected
        supabase
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
          .in('month', selectedMonths),

        // 2. Fetch salary_costs: SUM amount by (year, month, customer_id)
        supabase
          .from('salary_costs')
          .select(`
            year, month, customer_id, company_id, amount
          `)
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths),

        // 3. Fetch costs: SUM cost by (year, month) with is_cost = true
        supabase
          .from('costs')
          .select(`
            year, month, cost, is_cost
          `)
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths)
          .eq('is_cost', true),

        // 4. Fetch cost_types to get the ID for "Salary" cost type by CODE
        supabase
          .from('cost_types')
          .select('id, name, code')
          .eq('code', 'Salary'),

        // 5. Fetch salary_costs without customer_id: SUM amount by (year, month, company_id)
        supabase
          .from('salary_costs')
          .select(`
            year, month, company_id, amount
          `)
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths)
          .is('customer_id', null),

        // 6. Fetch bonus_by_c for the selected year
        supabase
          .from('bonus_by_c')
          .select(`
            year, company_id, bn_bmm
          `)
          .eq('year', Number(selectedYear)),

        // 7. Fetch customers data for debug function
        supabase
          .from('customers')
          .select('id, code, name'),

        // 8. Fetch companies data for debug function
        supabase
          .from('companies')
          .select('id, code, name')
      ]);

      // Check for errors
      if (error) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu revenues.",
        });
        setLoading(false);
        return;
      }

      if (salaryError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu salary_costs.",
        });
        setLoading(false);
        return;
      }

      if (costError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu costs.",
        });
        setLoading(false);
        return;
      }

      if (costTypesError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu cost_types.",
        });
        setLoading(false);
        return;
      }

      if (salaryWithoutCustomerError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu salary_costs without customer_id.",
        });
        setLoading(false);
        return;
      }

      if (bonusError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu bonus_by_c.",
        });
        setLoading(false);
        return;
      }

      if (customersError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu customers.",
        });
        setLoading(false);
        return;
      }

      if (companiesError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu companies.",
        });
        setLoading(false);
        return;
      }

      const salaryTypeId = costTypes?.[0]?.id;

      // 3.2. Fetch salary costs from costs table with cost_type = "Salary"
      let salaryCostRows = [];
      if (salaryTypeId) {
        const { data: salaryFromCosts, error: salaryFromCostsError } = await supabase
          .from('costs')
          .select(`
            year, month, cost
          `)
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths)
          .eq('cost_type', salaryTypeId);

        if (salaryFromCostsError) {
          toast({
            variant: "destructive",
            title: "Lỗi lấy dữ liệu",
            description: "Không lấy được dữ liệu salary costs từ bảng costs.",
          });
          setLoading(false);
          return;
        }
        salaryCostRows = salaryFromCosts || [];
      }

      // Aggregation per filter

      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      const salaryByPeriod = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);
      }

      // NEW: Salary costs without customer_id (unassigned)
      const salaryWithoutCustomerMap = new Map<string, number>();
      for (const row of salaryWithoutCustomerRows ?? []) {
        const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
        salaryWithoutCustomerMap.set(periodCompanyKey, (salaryWithoutCustomerMap.get(periodCompanyKey) ?? 0) + Number(row.amount) || 0);
      }

      // Salary costs từ bảng costs với cost_type = "Salary"
      const salaryCostByPeriod = new Map<string, number>();
      for (const row of salaryCostRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        salaryCostByPeriod.set(periodKey, (salaryCostByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // Total revenue by period for tax calculation
      const revenueByPeriod = new Map<string, number>();
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + Number(row.vnd_revenue) || 0);
      }

      const bmmByPeriod = new Map<string, number>();
      const bmmByPeriodCompany = new Map<string, number>(); // New: BMM by period and company
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + Number(row.quantity) || 0);
        bmmByPeriodCompany.set(periodCompanyKey, (bmmByPeriodCompany.get(periodCompanyKey) ?? 0) + Number(row.quantity) || 0);
      }

      // Create salary map by (year, month, customer_id) - MOVED UP before debug function
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (row.customer_id) { // Only include rows with customer_id
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          salaryMap.set(salaryKey, (salaryMap.get(salaryKey) ?? 0) + Number(row.amount) || 0);
        }
      }

      // Use bonus rate from parameters instead of bonus_by_c
      const percentBn = bonusRate * 100; // Convert decimal to percentage for calculation

      // Calculate salaryBonus correctly for each period by summing up bonus for each company
      const salaryBonusByPeriod = new Map<string, number>();
      for (const [periodKey] of bmmByPeriod.entries()) {
        let totalSalaryBonus = 0;

        // Sum bonus for each company in this period
        for (const [periodCompanyKey, bmm] of bmmByPeriodCompany.entries()) {
          if (periodCompanyKey.startsWith(periodKey + '_')) {
            const companyId = periodCompanyKey.replace(periodKey + '_', '');
            const bnBmm = bonusRows?.find(b => b.company_id === companyId)?.bn_bmm || 0;
            totalSalaryBonus += bmm * bnBmm;
          }
        }

        salaryBonusByPeriod.set(periodKey, totalSalaryBonus);
      }

      const overheadPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey, totalCostFromCosts] of costByPeriod.entries()) {
        const salaryCostFromSalaryCosts = salaryByPeriod.get(periodKey) ?? 0;
        const salaryCostFromCosts = salaryCostByPeriod.get(periodKey) ?? 0;
        const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const salaryBonus = salaryBonusByPeriod.get(periodKey) ?? 0; // Get pre-calculated value

        // Calculate Bonus Cost using parameter value
        const bonusCost = salaryCostFromCosts * bonusRate;

        // Calculate Tax Cost using parameter value
        const profitBeforeTax = totalRevenue - totalCostFromCosts;
        const taxCost = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;

        // Calculate Adjusted Total Cost = Total Cost (from costs) + Bonus Cost + Tax Cost
        const adjustedTotalCost = totalCostFromCosts + bonusCost + taxCost;

        let overhead = 0;
        if (totalBmm !== 0) {
          // FIXED: Use correct formula including salaryBonus
          overhead = (adjustedTotalCost - salaryCostFromSalaryCosts - salaryBonus) / totalBmm;
        }
        overheadPerBMMByPeriod.set(periodKey, overhead);
      }

      // Create bonus map by company_id - FIXED: Remove percent_bn reference
      const bonusMap = new Map<string, number>();
      for (const row of bonusRows ?? []) {
        bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
      }

      

      // BƯỚC 1: Tính tổng BMM theo customer trước khi group
      const customerBMMMap = new Map<string, number>(); // key: ${year}_${month}_${customer_id}_${company_id}
      for (const row of rows ?? []) {
        const customerKey = `${row.year}_${row.month}_${row.customer_id}_${row.company_id}`;
        const bmm = Number(row.quantity) || 0;
        customerBMMMap.set(customerKey, (customerBMMMap.get(customerKey) || 0) + bmm);
      }

      // --- GROUP: by (customer_id, company_id, year, month), aggregate bmm, revenue
      const groupMap = new Map<string, CustomerReportData>();
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.customer_id}_${row.company_id}`;
        let prev = groupMap.get(groupKey);
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;

        const periodKey = `${row.year}_${row.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const baseOverheadCost = overheadPerBMM * bmm;

        // Tính bonus theo công thức đơn giản: BMM × BN_BMM
        const bnBmm = bonusMap.get(row.company_id) ?? 0;
        const bonusValue = bmm * bnBmm;

        const overheadCost = baseOverheadCost; // Chỉ overhead thuần túy, không cộng bonus

        if (prev) {
          // ✅ Chỉ cộng dồn BMM, revenue, overhead, bonus - KHÔNG tính lại allocated salary cost
          prev.bmm += bmm;
          prev.revenue += revenue;
          prev.overheadCost += overheadCost;
          prev.bonusValue += bonusValue;
        } else {
          // Find salary cost for this (year, month, customer_id)
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          const baseSalaryCost = salaryMap.get(salaryKey) || 0;

          // BƯỚC 2: Tính allocated salary cost với TỔNG BMM của customer
          const customerKey = `${row.year}_${row.month}_${row.customer_id}_${row.company_id}`;
          const totalCustomerBMM = customerBMMMap.get(customerKey) || 0; // SỬ DỤNG TỔNG BMM

          const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
          const unassignedSalaryCost = salaryWithoutCustomerMap.get(periodCompanyKey) || 0;
          const totalCompanyBMM = bmmByPeriodCompany.get(periodCompanyKey) || 0;

          let allocatedSalaryCost = 0;
          if (totalCompanyBMM > 0) {
            // ✅ Dùng totalCustomerBMM thay vì bmm từ row hiện tại
            allocatedSalaryCost = (unassignedSalaryCost / totalCompanyBMM) * totalCustomerBMM;
          }

          const totalSalaryCost = baseSalaryCost + allocatedSalaryCost;

          groupMap.set(groupKey, {
            year: row.year,
            month: row.month, // integer 1-12
            customer_id: row.customer_id,
            customer_code: row.customers?.code || 'N/A',
            company_id: row.company_id,
            company_code: row.companies?.code || 'N/A',
            bmm,
            revenue,
            salaryCost: totalSalaryCost,
            overheadCost,
            bonusValue,
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
  }, [selectedYear, selectedMonths, bonusRate, taxRate]);

  const exportToCSV = () => {
    exportCustomerReportCSV(groupedData, 0); // Pass 0 as bonusRate since we're not using it anymore
    toast({
      title: "Export Successful",
      description: "Customer report has been successfully exported as a CSV file.",
    });
  };

  // Use totals directly from state (calculated in ReportTable)
  const {
    totalRevenue,
    totalBMM, 
    totalBonus,
    totalCost,
    totalProfit,
    totalProfitPercent
  } = totals;

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
              bonusRate={0}
              onFilteredDataChange={handleFilteredDataChange}
              onTotalsChange={handleTotalsChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerReport;
