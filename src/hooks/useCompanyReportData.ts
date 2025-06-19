import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

      // Process Base Salary Cost (có customer_id)
      const baseSalaryByPeriod = new Map<string, number>();
      const baseSalaryByCompany = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.company_id) continue;
        const periodKey = `${row.year}_${row.month}`;
        baseSalaryByPeriod.set(periodKey, (baseSalaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);
        const companyKey = `${row.year}_${row.month}_${row.company_id}`;
        baseSalaryByCompany.set(companyKey, (baseSalaryByCompany.get(companyKey) ?? 0) + Number(row.amount) || 0);
      }

      // Process Allocated Salary Cost (không có customer_id)
      const salaryWithoutCustomerMap = new Map<string, number>();
      for (const row of salaryWithoutCustomerRows ?? []) {
        if (!row.company_id) continue;
        const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
        salaryWithoutCustomerMap.set(periodCompanyKey, (salaryWithoutCustomerMap.get(periodCompanyKey) ?? 0) + Number(row.amount) || 0);
      }

      // 🔍 DEBUG: Company Report Salary Cost Calculation
      console.log('');
      console.log('🏢 COMPANY REPORT - SALARY COST DEBUG');
      console.log('====================================');
      console.log('📊 Selected Year:', selectedYear);
      console.log('📅 Selected Months:', selectedMonths);
      console.log('');
      
      // DEBUG: Raw data counts
      console.log('📋 RAW DATA COUNTS:');
      console.log('  - Salary costs with customer_id:', (salaryRows ?? []).length, 'records');
      console.log('  - Salary costs without customer_id:', (salaryWithoutCustomerRows ?? []).length, 'records');
      console.log('');

      // DEBUG: Base Salary Cost by Company (January 2025)
      if (selectedYear === '2025' && selectedMonths.includes(1)) {
        console.log('💰 BASE SALARY COST BY COMPANY (January 2025):');
        for (const [companyKey, amount] of baseSalaryByCompany.entries()) {
          if (companyKey.startsWith('2025_1_')) {
            const companyId = companyKey.replace('2025_1_', '');
            console.log(`  🏭 Company ID ${companyId}: ${Math.round(amount).toLocaleString()} VND`);
          }
        }
        console.log('');

        console.log('📊 ALLOCATED SALARY COST BY COMPANY (January 2025):');
        for (const [periodCompanyKey, amount] of salaryWithoutCustomerMap.entries()) {
          if (periodCompanyKey.startsWith('2025_1_')) {
            const companyId = periodCompanyKey.replace('2025_1_', '');
            console.log(`  🏭 Company ID ${companyId}: ${Math.round(amount).toLocaleString()} VND`);
          }
        }
        console.log('');
      }

      // Total salary by period (for overhead calculation)
      const salaryByPeriod = new Map<string, number>();
      for (const [periodKey, amount] of baseSalaryByPeriod.entries()) {
        salaryByPeriod.set(periodKey, amount);
      }
      for (const [periodCompanyKey, amount] of salaryWithoutCustomerMap.entries()) {
        const periodKey = periodCompanyKey.split('_').slice(0, 2).join('_');
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + amount);
      }

      const costByPeriod = new Map<string, number>();
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      const revenueByPeriod = new Map<string, number>();
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + Number(row.vnd_revenue) || 0);
      }

      const bmmByPeriod = new Map<string, number>();
      for (const row of rows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + Number(row.quantity) || 0);
      }

      // Get first percent_bn value for bonus calculation
      const firstPercentBn = bonusRows && bonusRows.length > 0 ? Number(bonusRows[0].percent_bn) || 0 : 0;

      // Create map for BMM by (period, company)
      const bmmByPeriodCompany = new Map<string, number>();
      for (const row of rows ?? []) {
        const periodCompanyKey = `${row.year}_${row.month}_${row.company_id}`;
        const bmm = Number(row.quantity) || 0;
        bmmByPeriodCompany.set(periodCompanyKey, (bmmByPeriodCompany.get(periodCompanyKey) ?? 0) + bmm);
      }

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
      for (const [periodKey, totalCost] of costByPeriod.entries()) {
        const salaryCost = salaryByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const salaryBonus = salaryBonusByPeriod.get(periodKey) ?? 0; // Get pre-calculated value
        const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
        // Calculate bonus cost and adjusted total cost
        const bonusCost = salaryCost * (firstPercentBn / 100);
        const taxCost = totalRevenue * 0.1; // Assuming 10% tax rate
        const adjustedTotalCost = totalCost + bonusCost + taxCost;

        let overhead = 0;
        if (totalBmm !== 0) {
          // FIXED: Use correct formula including salaryBonus
          overhead = (adjustedTotalCost - salaryCost - salaryBonus) / totalBmm;
        }
        overheadPerBMMByPeriod.set(periodKey, overhead);
      }

      // Tạo map bonus theo company_id
      const bonusMap = new Map<string, number>();
      for (const row of bonusRows ?? []) {
        bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
      }

      // --- Group by company ---
      const groupMap = new Map<string, GroupedCompanyData>();
      let debugCompanyCount = 0;
      
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.company_id}`;
        let prev = groupMap.get(groupKey);
        const bmm = Number(row.quantity) || 0;
        const revenue = Number(row.vnd_revenue) || 0;

        const periodKey = `${row.year}_${row.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const overheadCost = overheadPerBMM * bmm;

        // Tính bonus = BMM * bn_bmm từ bảng bonus_by_c
        const bnBmm = bonusMap.get(row.company_id) ?? 0;
        const bonusValue = bmm * bnBmm;

        // 🔍 DEBUG: Salary Cost Calculation for each company
        const baseSalaryKey = `${row.year}_${row.month}_${row.company_id}`;
        const baseSalaryCost = baseSalaryByCompany.get(baseSalaryKey) || 0;
        const allocatedSalaryKey = `${row.year}_${row.month}_${row.company_id}`;
        const allocatedSalaryCost = salaryWithoutCustomerMap.get(allocatedSalaryKey) || 0;
        const totalSalaryCost = baseSalaryCost + allocatedSalaryCost;

        // DEBUG: Log detailed calculation for January 2025
        if (selectedYear === '2025' && selectedMonths.includes(1) && row.year === 2025 && row.month === 1) {
          debugCompanyCount++;
          console.log(`🔍 DEBUG COMPANY ${debugCompanyCount} - ${row.companies?.code || 'Unknown'}:`);
          console.log(`  📋 Group Key: ${groupKey}`);
          console.log(`  🏭 Company ID: ${row.company_id}`);
          console.log(`  💰 Base Salary Key: ${baseSalaryKey}`);
          console.log(`  💰 Base Salary Cost: ${Math.round(baseSalaryCost).toLocaleString()} VND`);
          console.log(`  📊 Allocated Salary Key: ${allocatedSalaryKey}`);
          console.log(`  📊 Allocated Salary Cost: ${Math.round(allocatedSalaryCost).toLocaleString()} VND`);
          console.log(`  🎯 Total Salary Cost: ${Math.round(totalSalaryCost).toLocaleString()} VND`);
          console.log(`  📦 BMM: ${bmm}`);
          console.log(`  💵 Revenue: ${Math.round(revenue).toLocaleString()} VND`);
          console.log(`  🎁 Bonus Value: ${Math.round(bonusValue).toLocaleString()} VND`);
          console.log(`  📈 Overhead Cost: ${Math.round(overheadCost).toLocaleString()} VND`);
          console.log(`  ❓ Is Existing Group: ${prev ? 'YES' : 'NO'}`);
          console.log('');
        }

        if (prev) {
          prev.bmm += bmm;
          prev.revenue += revenue;
          prev.overheadCost += overheadCost;
          prev.bonusValue += bonusValue;
          
          // ✅ FIX: Don't overwrite salary cost - keep the original value
          // Salary cost should only be calculated once per group, not per revenue row
          
          // DEBUG: Log update for January 2025
          if (selectedYear === '2025' && selectedMonths.includes(1) && row.year === 2025 && row.month === 1) {
            console.log(`🔄 UPDATED EXISTING GROUP - ${row.companies?.code || 'Unknown'}:`);
            console.log(`  🎯 Kept Original Salary Cost: ${Math.round(prev.salaryCost).toLocaleString()} VND (NOT OVERWRITTEN)`);
            console.log(`  📦 Updated BMM: ${prev.bmm}`);
            console.log(`  💵 Updated Revenue: ${Math.round(prev.revenue).toLocaleString()} VND`);
            console.log('');
          }
        } else {
          groupMap.set(groupKey, {
            year: row.year,
            month: row.month,
            company_id: row.company_id,
            company_code: row.companies?.code || "N/A",
            bmm,
            revenue,
            salaryCost: totalSalaryCost,
            overheadCost,
            bonusValue,
          });
          
          // DEBUG: Log new group for January 2025
          if (selectedYear === '2025' && selectedMonths.includes(1) && row.year === 2025 && row.month === 1) {
            console.log(`✨ CREATED NEW GROUP - ${row.companies?.code || 'Unknown'}:`);
            console.log(`  🎯 Initial Total Salary Cost: ${Math.round(totalSalaryCost).toLocaleString()} VND`);
            console.log(`  📦 Initial BMM: ${bmm}`);
            console.log(`  💵 Initial Revenue: ${Math.round(revenue).toLocaleString()} VND`);
            console.log('');
          }
        }
      }

      // -- Sắp xếp theo month, company_code --
      const resultArr = Array.from(groupMap.values());
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
        console.log('🔎 COMPARISON WITH CUSTOMER REPORT:');
        console.log('  Customer Report SKG Salary Cost: 448,562,470 VND');
        console.log('  Customer Report SPLUS Salary Cost: 1,664,067,456 VND');
        console.log('  Customer Report Total Salary Cost: 2,112,629,926 VND');
        console.log('');
        
        const skgResult = jan2025Results.find(r => r.company_code === 'SKG');
        const splusResult = jan2025Results.find(r => r.company_code === 'SPLUS');
        
        if (skgResult) {
          const skgDiff = skgResult.salaryCost - 448562470;
          console.log(`  SKG Difference: ${Math.round(skgDiff).toLocaleString()} VND`);
        }
        
        if (splusResult) {
          const splusDiff = splusResult.salaryCost - 1664067456;
          console.log(`  SPLUS Difference: ${Math.round(splusDiff).toLocaleString()} VND`);
        }
        
        const totalDiff = totalSalaryCost - 2112629926;
        console.log(`  Total Difference: ${Math.round(totalDiff).toLocaleString()} VND`);
        console.log('');
      }

      setGroupedData(resultArr);
      setLoading(false);
    };
    fetchData();
    // We consciously ignore toast from dependencies since it won't change.
    // eslint-disable-next-line
  }, [selectedYear, selectedMonths]);

  return {
    groupedData,
    loading,
  };
}