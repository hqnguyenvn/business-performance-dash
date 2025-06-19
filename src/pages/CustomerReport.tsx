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

export type GroupedCustomerData = {
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
};

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

        // DEBUG: Total cost from costs table with cost_type = Salary (January 2025)
        if (selectedYear === '2025' && selectedMonths.includes(1)) {
          const jan2025SalaryFromCosts = salaryFromCosts
            ?.filter(row => row.year === 2025 && row.month === 1)
            ?.reduce((sum, row) => sum + Number(row.cost || 0), 0) || 0;
          console.log('3️⃣ Total cost from costs table with cost_type = Salary (January 2025):', jan2025SalaryFromCosts);
        }
      }

       // Fetch salary_costs without customer_id: SUM amount by (year, month, company_id)
       const { data: salaryWithoutCustomerRows, error: salaryWithoutCustomerError } = await supabase
       .from('salary_costs')
       .select(`
         year, month, company_id, amount
       `)
       .eq('year', Number(selectedYear))
       .in('month', selectedMonths)
       .is('customer_id', null);

     if (salaryWithoutCustomerError) {
       toast({
         variant: "destructive",
         title: "Lỗi lấy dữ liệu",
         description: "Không lấy được dữ liệu salary_costs without customer_id.",
       });
       setLoading(false);
       return;
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

      // Get first percent_bn value for bonus calculation
      const firstPercentBn = bonusRows && bonusRows.length > 0 ? Number(bonusRows[0].percent_bn) || 0 : 0;
      const firstBnBmm = bonusRows && bonusRows.length > 0 ? Number(bonusRows[0].bn_bmm) || 0 : 0;

      // Pre-calculate salaryBonus for all periods (avoiding loops)
      const salaryBonusByPeriod = new Map<string, number>();
      for (const [periodKey, totalBmm] of bmmByPeriod.entries()) {
        const salaryBonus = totalBmm * firstBnBmm;
        salaryBonusByPeriod.set(periodKey, salaryBonus);
      }

      const overheadPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey, totalCostFromCosts] of costByPeriod.entries()) {
        const salaryCostFromSalaryCosts = salaryByPeriod.get(periodKey) ?? 0;
        const salaryCostFromCosts = salaryCostByPeriod.get(periodKey) ?? 0;
        const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const salaryBonus = salaryBonusByPeriod.get(periodKey) ?? 0; // Get pre-calculated value

        // Calculate Bonus Cost = Total Salary (from costs with cost_type = "Salary") × percent_bn
        const bonusCost = salaryCostFromCosts * (firstPercentBn / 100);

        // Calculate Tax Cost = (Total Revenue - Total Cost from costs) × 5% (if profit > 0)
        const profitBeforeTax = totalRevenue - totalCostFromCosts;
        const taxCost = profitBeforeTax > 0 ? profitBeforeTax * 0.05 : 0;

        // Calculate Adjusted Total Cost = Total Cost (from costs) + Bonus Cost + Tax Cost
        const adjustedTotalCost = totalCostFromCosts + bonusCost + taxCost;

        let overhead = 0;
        if (totalBmm !== 0) {
          // FIXED: Use correct formula including salaryBonus
          overhead = (adjustedTotalCost - salaryCostFromSalaryCosts - salaryBonus) / totalBmm;
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

        console.log('🔍 HYPREX SALARY COST BREAKDOWN DEBUG');
        console.log('=====================================');

        // Filter for Hyprex rows in January 2025
        const hyprexJan2025Rows = rows.filter(r => 
          r.customer_id === hyprexCustomer.id && 
          r.year === 2025 && 
          r.month === 1
        );

        console.log(`📊 Hyprex January 2025 rows found: ${hyprexJan2025Rows.length}`);

        if (hyprexJan2025Rows.length === 0) {
          console.log('❌ No Hyprex data found for January 2025');
          return;
        }

        hyprexJan2025Rows.forEach(row => {
          const customerBMM = Number(row.quantity) || 0;

          // 1. Calculate baseSalaryCost
          const salaryKey = `${row.year}_${row.month}_${row.customer_id}`;
          const baseSalaryCost = salaryMap.get(salaryKey) || 0;

          // 2. Calculate allocatedSalaryCost
          const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
          const unassignedSalaryCost = salaryWithoutCustomerMap.get(periodCompanyKey) || 0;
          const totalCompanyBMM = bmmByPeriodCompany.get(periodCompanyKey) || 0;

          let allocatedSalaryCost = 0;
          if (totalCompanyBMM > 0) {
            allocatedSalaryCost = (unassignedSalaryCost / totalCompanyBMM) * customerBMM;
          }

          const totalSalaryCost = baseSalaryCost + allocatedSalaryCost;

          console.log(`🔍 Customer ${row.customers?.code || 'Unknown'} (BMM: ${customerBMM.toLocaleString()})`);
          console.log(`   - Base Salary Cost: ${Math.round(baseSalaryCost).toLocaleString()}`);
          console.log(`   - Unassigned Salary Cost: ${Math.round(unassignedSalaryCost).toLocaleString()}`);
          console.log(`   - Total Company BMM: ${totalCompanyBMM.toLocaleString()}`);
          console.log(`   - Calculation: (${Math.round(unassignedSalaryCost).toLocaleString()} / ${totalCompanyBMM.toLocaleString()}) × ${customerBMM.toLocaleString()}`);
          console.log(`   - Result: ${Math.round(allocatedSalaryCost).toLocaleString()}`);
          console.log('===============================================');
        });

        // DEBUG: Console log all Allocated Salary Cost components for January 2025
        console.log('📊 ALLOCATED SALARY COST FORMULA COMPONENTS (January 2025)');
        console.log('===================================================');

        const jan2025Rows = rows.filter(r => r.year === 2025 && r.month === 1);

        // Group rows by customer_id and sum BMM for each customer
        const customerBMMMap = new Map<string, { customer: any, totalBMM: number, company_id: string }>();

        jan2025Rows.forEach(row => {
          const customerId = row.customer_id;
          const bmm = Number(row.quantity) || 0;

          if (customerBMMMap.has(customerId)) {
            const existing = customerBMMMap.get(customerId)!;
            existing.totalBMM += bmm;
          } else {
            customerBMMMap.set(customerId, {
              customer: row.customers,
              totalBMM: bmm,
              company_id: row.company_id
            });
          }
        });

        // Log debug information for each customer
        customerBMMMap.forEach((customerData, customerId) => {
          const customerBMM = customerData.totalBMM;
          const periodCompanyKey = `2025_1_${customerData.company_id}`;
          const unassignedSalaryCost = salaryWithoutCustomerMap.get(periodCompanyKey) || 0;
          const totalCompanyBMM = bmmByPeriodCompany.get(periodCompanyKey) || 0;

          let allocatedSalaryCost = 0;
          if (totalCompanyBMM > 0) {
            allocatedSalaryCost = (unassignedSalaryCost / totalCompanyBMM) * customerBMM;
          }

          console.log(`🏢 Customer: ${customerData.customer?.code || 'Unknown'}`);
          console.log(`   📋 Formula: Allocated Salary Cost = (Unassigned Salary Cost / Total Company BMM) × Customer BMM`);
          console.log(`   💰 Unassigned Salary Cost: ${Math.round(unassignedSalaryCost).toLocaleString()} VND`);
          console.log(`   📊 Total Company BMM: ${totalCompanyBMM.toLocaleString()}`);
          console.log(`   👤 Customer BMM: ${customerBMM.toLocaleString()}`);
          console.log(`   🧮 Calculation: (${Math.round(unassignedSalaryCost).toLocaleString()} ÷ ${totalCompanyBMM.toLocaleString()}) × ${customerBMM.toLocaleString()}`);
          console.log(`   ✅ Allocated Salary Cost: ${Math.round(allocatedSalaryCost).toLocaleString()} VND`);
          console.log('   ────────────────────────────────────────────────────────');
        });

        console.log('============================================================');
      };

      // Call debug function
      debugHyprexCalculation(rows ?? []);

      // DEBUG: January 2025 breakdown function
      const debugJanuary2025Stats = () => {
        if (selectedYear !== '2025' || !selectedMonths.includes(1)) return;

        // 1. Total Revenue từ bảng revenues
        const totalRevenue = rows
          ?.filter(r => r.year === 2025 && r.month === 1)
          ?.reduce((sum, r) => sum + Number(r.vnd_revenue || 0), 0) || 0;

        // 2. Cost từ bảng costs (is_cost = true)
        const cost = costRows
          ?.filter(r => r.year === 2025 && r.month === 1)
          ?.reduce((sum, r) => sum + Number(r.cost || 0), 0) || 0;

        // 3. Total Salary từ bảng costs với cost_type = "Salary"
        const totalSalary = salaryCostRows
          ?.filter(r => r.year === 2025 && r.month === 1)
          ?.reduce((sum, r) => sum + Number(r.cost || 0), 0) || 0;

        // 4. Bonus by Salary = Total Salary × 15%
        const bonusBySalary = totalSalary * 0.15;

        // 5. Total Cost = Cost + Bonus by Salary
        const totalCost = cost + bonusBySalary;

        // 6. Salary Cost từ bảng salary_costs
        const salaryCost = salaryRows
          ?.filter(r => r.year === 2025 && r.month === 1)
          ?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;

        // 7. Overhead Cost = Total Cost - Salary Cost
        const overheadCost = totalCost - salaryCost;

        console.log('🗓️ JANUARY 2025 BREAKDOWN');
        console.log('=====================');
        console.log('📊 Total Revenue (from revenues table):', totalRevenue.toLocaleString(), 'VND');
        console.log('💰 Cost (from costs table):', cost.toLocaleString(), 'VND');
        console.log('👥 Total Salary (from costs table with cost_type = "Salary"):', totalSalary.toLocaleString(), 'VND');
        console.log('🎁 Bonus by Salary (15%):', bonusBySalary.toLocaleString(), 'VND');
        console.log('💸 Total Cost (Cost + Bonus by Salary):', totalCost.toLocaleString(), 'VND');
        console.log('💼 Salary Cost (from salary_costs table):', salaryCost.toLocaleString(), 'VND');
        console.log('🏢 Overhead Cost (Total Cost - Salary Cost):', overheadCost.toLocaleString(), 'VND');
        console.log('=====================');
      };

      // Call January 2025 debug function
      debugJanuary2025Stats();

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

        // Tính bonus theo công thức đơn giản: BMM × BN_BMM
        const bnBmm = bonusMap.get(row.company_id) ?? 0;
        const bonusValue = bmm * bnBmm;

        const overheadCost = baseOverheadCost; // Chỉ overhead thuần túy, không cộng bonus

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

      // Added for debugging purposes
      if (selectedYear === '2025' && selectedMonths.includes(1)) {
          const totalSalaryCostFromSalaryCosts = salaryRows
              ?.filter(row => row.year === 2025 && row.month === 1)
              ?.reduce((sum, row) => sum + Number(row.amount || 0), 0) || 0;
          console.log('2️⃣ Total salary cost from salary_costs (January 2025):', totalSalaryCostFromSalaryCosts);

          const totalBMMFromRevenues = rows
              ?.filter(row => row.year === 2025 && row.month === 1)
              ?.reduce((sum, row) => sum + Number(row.quantity || 0), 0) || 0;
          console.log('4️⃣ Total BMM from revenues (January 2025):', totalBMMFromRevenues);
      }
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

    useEffect(() => {
        if (selectedYear === '2025' && selectedMonths.includes(1)) {
            console.log('1️⃣ Adjusted Total Cost (January 2025):', totalCost);
        }
    }, [totalCost, selectedYear, selectedMonths]);

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