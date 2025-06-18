import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
          year, month, customer_id, company_id, amount
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

      // 3.1. Fetch ALL cost_types first to debug
      const { data: allCostTypes, error: allCostTypesError } = await supabase
        .from('cost_types')
        .select('id, name, code');

      console.log('🔍 ALL COST TYPES:', allCostTypes);

      // 3.1. Fetch cost_types to get the ID for "Salary" cost type by CODE
      const { data: costTypes, error: costTypesError } = await supabase
        .from('cost_types')
        .select('id, name, code')
        .eq('code', 'Salary');

      if (costTypesError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu cost_types.",
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

      // 4. Fetch bonus_by_c for the selected year
      const { data: bonusRows, error: bonusError } = await supabase
        .from('bonus_by_c')
        .select(`
          year, company_id, bn_bmm, percent_bn
        `)
        .eq('year', Number(selectedYear));

      if (bonusError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu bonus_by_c.",
        });
        setLoading(false);
        return;
      }

      // 5. Fetch customers data for debug function
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, code, name');

      if (customersError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu customers.",
        });
        setLoading(false);
        return;
      }

      // Aggregation per filter

      const salaryByPeriod = new Map<string, number>();
      const salaryMap = new Map<string, number>();
      const salaryWithoutCustomerMap = new Map<string, number>(); // New: salary costs without customer_id

      for (const row of salaryRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);

        if (row.customer_id) {
          // Salary costs with customer_id
          const custKey = `${row.year}_${row.month}_${row.customer_id}`;
          salaryMap.set(custKey, (salaryMap.get(custKey) ?? 0) + Number(row.amount) || 0);
        } else {
          // Salary costs without customer_id (to be allocated)
          const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
          salaryWithoutCustomerMap.set(periodCompanyKey, (salaryWithoutCustomerMap.get(periodCompanyKey) ?? 0) + Number(row.amount) || 0);
        }
      }

      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // Aggregate salary costs from costs table by period
      const salaryCostByPeriod = new Map<string, number>();
      for (const row of salaryCostRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        salaryCostByPeriod.set(periodKey, (salaryCostByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      const bmmByPeriod = new Map<string, number>();
      const bmmByPeriodCompany = new Map<string, number>(); // New: BMM by period and company
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + Number(row.quantity) || 0);
        bmmByPeriodCompany.set(periodCompanyKey, (bmmByPeriodCompany.get(periodCompanyKey) ?? 0) + Number(row.quantity) || 0);
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

      // Create bonus map by company_id
      const bonusMap = new Map<string, number>();
      const percentBnMap = new Map<string, number>();
      for (const row of bonusRows ?? []) {
        bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
        percentBnMap.set(row.company_id, Number(row.percent_bn) || 0);
      }

      // DEBUG: Log detailed calculation for Hyprex customer
      const debugHyprexCalculation = (rows: any[]) => {
        const hyprexCustomer = customers.find(c => c.code === 'Hyprex');
        if (!hyprexCustomer) {
          console.log('❌ Hyprex customer not found');
          return;
        }

        console.log('🔍 HYPREX OVERHEAD COST CALCULATION DEBUG');
        console.log('==========================================');

        const hyprexRows = rows.filter(r => r.customer_id === hyprexCustomer.id);
        console.log(`📊 Hyprex rows found: ${hyprexRows.length}`);

        hyprexRows.forEach(row => {
          const periodKey = `${row.year}_${row.month}`;
          const bmm = Number(row.quantity) || 0;

          // Apply simplified formula
          const salaryCostFromCostsTable = salaryCostByPeriod.get(periodKey) ?? 0;
          const percentBn = percentBnMap.get(hyprexCustomer.id) ?? 0;

          let totalOverheadCost = 0;
          if (totalBMM > 0) {
            const totalCost = costByPeriod.get(periodKey) ?? 0;
            const salaryCostFromSalaryTable = salaryByPeriod.get(periodKey) ?? 0;
            const totalBMM = bmmByPeriod.get(periodKey) ?? 0;
            const allocationRatio = bmm / totalBMM;
            const baseCost = totalCost - salaryCostFromSalaryTable;
            const salaryAdjustment = (salaryCostFromCostsTable - salaryCostFromCostsTable) * percentBn;
            totalOverheadCost = allocationRatio * (baseCost + salaryAdjustment);
          }

          console.log(`📊 Period: ${row.year}-${row.month}, BMM: ${bmm}`);
          console.log(`📋 SIMPLIFIED FORMULA CALCULATION:`);
          console.log(`   - totalCost: ${costByPeriod.get(periodKey) ?? 0}`);
          console.log(`   - salaryCostFromSalaryTable: ${salaryByPeriod.get(periodKey) ?? 0}`);
          console.log(`   - salaryCostFromCostsTable: ${salaryCostByPeriod.get(periodKey) ?? 0}`);
          console.log(`   - percent_bn: ${(percentBn * 100).toFixed(1)}%`);
          console.log(`   - totalBMM: ${bmmByPeriod.get(periodKey) ?? 0}`);
          console.log(`   - bmm: ${bmm}`);
          console.log(`   - allocationRatio: ${bmmByPeriod.get(periodKey) ?? 0 > 0 ? (bmm / (bmmByPeriod.get(periodKey) ?? 0)).toFixed(4) : 0}`);
          console.log(`   - baseCost: ${costByPeriod.get(periodKey) ?? 0 - salaryByPeriod.get(periodKey) ?? 0}`);
          console.log(`   - salaryAdjustment: ${((salaryCostFromCostsTable - salaryCostFromCostsTable) * percentBn).toFixed(2)}`);
          console.log(`💡 Total Overhead Cost: ${totalOverheadCost.toFixed(2)}`);
          console.log('----------------------------------------');
        });
      };

      // Call debug function
      debugHyprexCalculation(rows ?? []);

      // --- GROUP: by (customer_id, company_id, year, month), aggregate bmm, revenue
      const groupMap = new Map<string, GroupedCustomerData>();
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.customer_id}_${row.company_id}`;
        let prev = groupMap.get(groupKey);
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;

        const periodKey = `${row.year}_${row.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const baseOverheadCost = overheadPerBMM * bmm;

        // Calculate salary bonus: (salaryCost * percent_bn) / totalBMM * bmm
        const salaryCostForPeriod = salaryCostByPeriod.get(periodKey) ?? 0;
        const percentBn = percentBnMap.get(row.company_id) ?? 0;
        const totalBmmForPeriod = bmmByPeriod.get(periodKey) ?? 0;

        let salaryBonus = 0;
        if (totalBmmForPeriod > 0) {
          salaryBonus = (salaryCostForPeriod * percentBn) / totalBmmForPeriod * bmm;
        }

        // Total overhead cost = base overhead + salary bonus
        const overheadCost = baseOverheadCost + salaryBonus;

        // Calculate bonus = BMM * bn_bmm from bonus_by_c table
        const bnBmm = bonusMap.get(row.company_id) ?? 0;
        const bonusValue = bmm * bnBmm;

        if (prev) {
          prev.bmm += bmm;
          prev.revenue += revenue;
          prev.overheadCost += overheadCost;
          prev.bonusValue += bonusValue;
        } else {
          // Find salary cost for this (year, month, customer_id)
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          const baseSalaryCost = salaryMap.get(salaryKey) || 0;

          // Calculate allocated salary cost from unassigned salary costs
          const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
          const unassignedSalaryCost = salaryWithoutCustomerMap.get(periodCompanyKey) || 0;
          const totalCompanyBMM = bmmByPeriodCompany.get(periodCompanyKey) || 0;

          let allocatedSalaryCost = 0;
          if (totalCompanyBMM > 0) {
            allocatedSalaryCost = (unassignedSalaryCost / totalCompanyBMM) * bmm;
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
  }, [selectedYear, selectedMonths]);

  const exportToCSV = () => {
    exportCustomerReportCSV(groupedData, 0); // Pass 0 as bonusRate since we're not using it anymore
    toast({
      title: "Export Successful",
      description: "Customer report has been successfully exported as a CSV file.",
    });
  };

  // Card totals - using bonusValue from data instead of calculated bonus
  const totalRevenue = groupedData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBMM = groupedData.reduce((sum, d) => sum + d.bmm, 0);
  const totalBonus = groupedData.reduce((sum, d) => sum + (d.bonusValue ?? 0), 0);

  // Calculate total cost using bonusValue instead of bonusRate
  const totalCost = groupedData.reduce((sum, d) => {
    const salary = d.salaryCost ?? 0;
    const bonus = d.bonusValue ?? 0; // Use bonusValue instead of calculating
    const oh = d.overheadCost ?? 0;
    return sum + salary + bonus + oh;
  }, 0);

  // Total profit, %profit
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
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerReport;