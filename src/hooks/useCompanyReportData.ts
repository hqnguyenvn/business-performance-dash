import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useParameterValues } from "@/hooks/useParameterValues";

// Tháng và năm để lọc, giống CustomerReport
export const MONTHS = [
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
export const YEARS = [2023, 2024, 2025];

export type GroupedCompanyData = {
  year: number;
  month: number;
  company_id: string;
  company_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number; // Thêm field này để lưu giá trị bonus được tính toán
};

interface UseCompanyReportDataProps {
  selectedYear: string;
  selectedMonths: number[];
}

export function useCompanyReportData({ selectedYear, selectedMonths }: UseCompanyReportDataProps) {
  const { toast } = useToast();
  const [groupedData, setGroupedData] = useState<GroupedCompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get parameter values from database
  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Lấy revenues cho các tháng đã chọn
      const { data: rows, error } = await supabase
        .from('revenues')
        .select(
          `
            year,
            month,
            company_id,
            quantity,
            vnd_revenue,
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

      // 2. Lấy salary_costs có customer_id (Base Salary Cost)
      const { data: salaryRows, error: salaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, company_id, customer_id, amount
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths)
        .not('customer_id', 'is', null);

      if (salaryError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu salary_costs.",
        });
        setLoading(false);
        return;
      }

      // 2.1. Lấy salary_costs không có customer_id (Allocated Salary Cost)
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
          description: "Không lấy được dữ liệu salary_costs without customer.",
        });
        setLoading(false);
        return;
      }

      // 3. Lấy costs: SUM cost by (year, month) với is_cost = true
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

      // 3.1. Fetch cost_types to get the ID for "Salary" cost type by CODE (2-step approach like CustomerReport)
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

      // 3.2. Fetch salary costs from costs table with cost_type = "Salary" ID
      let salaryCostRows = [];
      if (salaryTypeId) {
        const { data: salaryFromCosts, error: salaryFromCostsError } = await supabase
          .from('costs')
          .select(`
            year, month, cost
          `)
          .eq('year', Number(selectedYear))
          .in('month', selectedMonths)
          .eq('cost_type', salaryTypeId)
          .eq('is_cost', true);

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

      // 4. Lấy bonus_by_c cho năm đã chọn
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

      // === BƯỚC 1: GROUP VÀ AGGREGATE DỮ LIỆU THEO COMPANY ===

      // Group revenues theo company
      const companyRevenueMap = new Map<string, {
        year: number;
        month: number;
        company_id: string;
        company_code: string;
        totalBMM: number;
        totalRevenue: number;
      }>();

      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.company_id}`;
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;

        if (companyRevenueMap.has(groupKey)) {
          const existing = companyRevenueMap.get(groupKey)!;
          existing.totalBMM += bmm;
          existing.totalRevenue += revenue;
        } else {
          companyRevenueMap.set(groupKey, {
            year: row.year,
            month: row.month,
            company_id: row.company_id,
            company_code: row.companies?.code || "N/A",
            totalBMM: bmm,
            totalRevenue: revenue,
          });
        }
      }

      // Group salary costs theo company
      const companySalaryMap = new Map<string, number>();

      // Base salary (có customer_id)
      for (const row of salaryRows ?? []) {
        if (!row.company_id) continue;
        const companyKey = `${row.year}_${row.month}_${row.company_id}`;
        companySalaryMap.set(companyKey, (companySalaryMap.get(companyKey) ?? 0) + Number(row.amount) || 0);
      }

      // Allocated salary (không có customer_id)  
      for (const row of salaryWithoutCustomerRows ?? []) {
        if (!row.company_id) continue;
        const companyKey = `${row.year}_${row.month}_${row.company_id}`;
        companySalaryMap.set(companyKey, (companySalaryMap.get(companyKey) ?? 0) + Number(row.amount) || 0);
      }

      // === BƯỚC 2: TÍNH TOÁN CÁC METRICS THEO PERIOD ===

      // Total salary by period (for overhead calculation)
      const totalSalaryByPeriod = new Map<string, number>();
      for (const [companyKey, amount] of companySalaryMap.entries()) {
        const periodKey = companyKey.split('_').slice(0, 2).join('_');
        totalSalaryByPeriod.set(periodKey, (totalSalaryByPeriod.get(periodKey) ?? 0) + amount);
      }

      // Costs by period
      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // Salary cost từ bảng costs có cost_type = "salary"
      const salaryCostByPeriod = new Map<string, number>();
      for (const row of salaryCostRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        salaryCostByPeriod.set(periodKey, (salaryCostByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // Revenue và BMM by period
      const revenueByPeriod = new Map<string, number>();
      const bmmByPeriod = new Map<string, number>();
      for (const [groupKey, data] of companyRevenueMap.entries()) {
        const periodKey = `${data.year}_${data.month}`;
        revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + data.totalRevenue);
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + data.totalBMM);
      }

      // Use bonus rate from parameters (already in decimal format)

      // Tạo map bonus theo company_id
      const bonusMap = new Map<string, number>();
      for (const row of bonusRows ?? []) {
        bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
      }

      // Calculate salaryBonus by period
      const salaryBonusByPeriod = new Map<string, number>();
      for (const [groupKey, data] of companyRevenueMap.entries()) {
        const periodKey = `${data.year}_${data.month}`;
        const bnBmm = bonusMap.get(data.company_id) || 0;
        const bonusForThisCompany = data.totalBMM * bnBmm;
        salaryBonusByPeriod.set(periodKey, (salaryBonusByPeriod.get(periodKey) ?? 0) + bonusForThisCompany);
      }

      // Calculate overhead per BMM by period
      const overheadPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey, totalCostFromCosts] of costByPeriod.entries()) {
        const salaryCostFromCosts = salaryCostByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const salaryBonus = salaryBonusByPeriod.get(periodKey) ?? 0;
        const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
        const totalSalary = totalSalaryByPeriod.get(periodKey) ?? 0;

        // Calculate components using parameters
        const bonusCost = salaryCostFromCosts * bonusRate;
        const profitBeforeTax = totalRevenue - totalCostFromCosts;
        const taxCost = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;
        const totalOverhead = totalCostFromCosts + bonusCost + taxCost - salaryBonus - totalSalary;

        let overheadAvg = 0;
        if (totalBmm !== 0) {
          overheadAvg = totalOverhead / totalBmm;
        }
        overheadPerBMMByPeriod.set(periodKey, overheadAvg);

        // Debug log for January 2025
        if (selectedYear === '2025' && selectedMonths.includes(1) && periodKey === '2025_1') {
          console.log('');
          console.log('🧮 OVERHEAD COST CALCULATION DEBUG (January 2025)');
          console.log('=================================================');
          console.log(`📅 Period Key: ${periodKey}`);
          console.log('');
          console.log('📊 BƯỚC 1: DỮ LIỆU ĐẦU VÀO');
          console.log(`  💰 Total Cost from costs table: ${Math.round(totalCostFromCosts).toLocaleString()} VND`);
          console.log(`  🎯 Salary Cost from costs (cost_type='Salary'): ${Math.round(salaryCostFromCosts).toLocaleString()} VND`);
          console.log(`  📦 Total BMM: ${totalBmm.toLocaleString()}`);
          console.log(`  💵 Total Revenue: ${Math.round(totalRevenue).toLocaleString()} VND`);
          console.log(`  🎁 Salary Bonus (Sum bnByBMM): ${Math.round(salaryBonus).toLocaleString()} VND`);
          console.log(`  💰 Total Salary from salary_costs: ${Math.round(totalSalary).toLocaleString()} VND`);
          console.log(`  📊 Bonus Rate (from parameters): ${(bonusRate * 100)}%`);
          console.log(`  💸 Tax Rate (from parameters): ${(taxRate * 100)}%`);
          console.log('');
          console.log('📊 BƯỚC 3: TÍNH TOTAL OVERHEAD');
          console.log(`  📈 TotalOverhead = Total Cost + Bonus Cost + Tax Cost - Salary Bonus - Total Salary`);
          console.log(`  📈 TotalOverhead = ${Math.round(totalCostFromCosts).toLocaleString()} + ${Math.round(bonusCost).toLocaleString()} + ${Math.round(taxCost).toLocaleString()} - ${Math.round(salaryBonus).toLocaleString()} - ${Math.round(totalSalary).toLocaleString()}`);
          console.log(`  📈 TotalOverhead = ${Math.round(totalOverhead).toLocaleString()} VND`);
          console.log(`  📊 Overhead per BMM = ${Math.round(overheadAvg).toLocaleString()} VND/BMM`);
          console.log('');
        }
      }

      // === BƯỚC 3: TẠO FINAL RESULTS ===

      const resultArr: GroupedCompanyData[] = [];

      for (const [groupKey, companyData] of companyRevenueMap.entries()) {
        const periodKey = `${companyData.year}_${companyData.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const overheadCost = overheadPerBMM * companyData.totalBMM;

        // Tính bonus = BMM * bn_bmm từ bảng bonus_by_c
        const bnBmm = bonusMap.get(companyData.company_id) ?? 0;
        const bonusValue = companyData.totalBMM * bnBmm;

        // Lấy salary cost cho company này
        const salaryCost = companySalaryMap.get(groupKey) || 0;

        resultArr.push({
          year: companyData.year,
          month: companyData.month,
          company_id: companyData.company_id,
          company_code: companyData.company_code,
          bmm: companyData.totalBMM,
          revenue: companyData.totalRevenue,
          salaryCost,
          overheadCost,
          bonusValue,
        });
      }

      // Sắp xếp theo month, company_code
      resultArr.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.company_code.localeCompare(b.company_code);
      });

      // 🔍 DEBUG: Final Company Report Results
      if (selectedYear === '2025' && selectedMonths.includes(1)) {
        console.log('');
        console.log('🎯 FINAL COMPANY REPORT RESULTS (January 2025):');
        console.log('===============================================');

        const jan2025Results = resultArr.filter(r => r.year === 2025 && r.month === 1);
        let totalSalaryCost = 0;

        jan2025Results.forEach(result => {
          console.log(`🏭 Company: ${result.company_code}`);
          console.log(`  📦 BMM: ${result.bmm}`);
          console.log(`  💵 Revenue: ${Math.round(result.revenue).toLocaleString()} VND`);
          console.log(`  🎯 Salary Cost: ${Math.round(result.salaryCost).toLocaleString()} VND`);
          console.log(`  🎁 Bonus: ${Math.round(result.bonusValue).toLocaleString()} VND`);
          console.log(`  📈 Overhead Cost: ${Math.round(result.overheadCost).toLocaleString()} VND`);
          console.log('');
          totalSalaryCost += result.salaryCost;
        });

        console.log('📊 COMPANY REPORT TOTALS (January 2025):');
        console.log(`  🎯 Total Salary Cost: ${Math.round(totalSalaryCost).toLocaleString()} VND`);
        console.log('');
      }

      setGroupedData(resultArr);
      setLoading(false);
    };
    fetchData();
    // We consciously ignore toast from dependencies since it won't change.
    // eslint-disable-next-line
  }, [selectedYear, selectedMonths, bonusRate, taxRate]);

  return {
    groupedData,
    loading,
  };
}