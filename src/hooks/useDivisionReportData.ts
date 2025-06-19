
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Months and years for filter
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

export type GroupedDivisionData = {
  year: number;
  month: number;
  division_id: string;
  division_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number; // Thêm field này
};

interface UseDivisionReportDataProps {
  selectedYear: string;
  selectedMonths: number[];
}

export function useDivisionReportData({ selectedYear, selectedMonths }: UseDivisionReportDataProps) {
  const { toast } = useToast();
  const [groupedData, setGroupedData] = useState<GroupedDivisionData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch revenues by division với company_id join
      const { data: rows, error } = await supabase
        .from('revenues')
        .select(`
          year,
          month,
          division_id,
          quantity,
          vnd_revenue,
          divisions!revenues_division_id_fkey(code, company_id)
        `)
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

      // 2. Fetch salary_costs by division (có customer_id)
      const { data: salaryRows, error: salaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, division_id, amount
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

      // 3. Fetch allocated salary costs by division (không có customer_id)
      const { data: allocatedSalaryRows, error: allocatedSalaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, division_id, amount
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths)
        .is('customer_id', null);

      if (allocatedSalaryError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu allocated salary costs.",
        });
        setLoading(false);
        return;
      }

      // 4. Fetch salary costs từ bảng costs với cost_type="Salary"
      const { data: salaryCostRows, error: salaryCostError } = await supabase
        .from('costs')
        .select(`
          year, month, cost
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths)
        .eq('cost_type', 'Salary');

      if (salaryCostError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu salary costs from costs table.",
        });
        setLoading(false);
        return;
      }

      // 5. Fetch costs by period (không phải Salary)
      const { data: costRows, error: costError } = await supabase
        .from('costs')
        .select(`
          year, month, cost, is_cost
        `)
        .eq('year', Number(selectedYear))
        .in('month', selectedMonths)
        .eq('is_cost', true)
        .neq('cost_type', 'Salary');

      if (costError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu costs.",
        });
        setLoading(false);
        return;
      }

      // 6. Lấy bonus_by_d cho năm đã chọn (bn_bmm theo division)
      const { data: bonusByDRows, error: bonusByDError } = await supabase
        .from('bonus_by_d')
        .select(`
          year, division_id, bn_bmm
        `)
        .eq('year', Number(selectedYear));

      if (bonusByDError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu bonus_by_d.",
        });
        setLoading(false);
        return;
      }

      // 7. Lấy company_ids từ divisions để query bonus_by_c (percent_bn theo company)
      const companyIds = [...new Set(rows?.map(r => r.divisions?.company_id).filter(Boolean))];
      
      const { data: bonusByCompanyRows, error: bonusByCompanyError } = await supabase
        .from('bonus_by_c')
        .select(`
          year, company_id, percent_bn
        `)
        .eq('year', Number(selectedYear))
        .in('company_id', companyIds);

      if (bonusByCompanyError) {
        toast({
          variant: "destructive",
          title: "Lỗi lấy dữ liệu",
          description: "Không lấy được dữ liệu bonus_by_c.",
        });
        setLoading(false);
        return;
      }

      // === TÍNH TOÁN TƯƠNG TỰ COMPANY REPORT ===

      // Tạo maps cho dữ liệu
      const divisionRevenueMap = new Map<string, { year: number; month: number; division_id: string; division_code: string; totalRevenue: number; totalBMM: number; company_id: string }>();
      
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.division_id}`;
        let existing = divisionRevenueMap.get(groupKey);
        
        if (existing) {
          existing.totalRevenue += Number(row.vnd_revenue) || 0;
          existing.totalBMM += Number(row.quantity) || 0;
        } else {
          divisionRevenueMap.set(groupKey, {
            year: row.year,
            month: row.month,
            division_id: row.division_id,
            division_code: row.divisions?.code || "N/A",
            totalRevenue: Number(row.vnd_revenue) || 0,
            totalBMM: Number(row.quantity) || 0,
            company_id: row.divisions?.company_id || "",
          });
        }
      }

      // Salary costs map (có customer_id)
      const divisionSalaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.division_id) continue;
        const key = `${row.year}_${row.month}_${row.division_id}`;
        divisionSalaryMap.set(key, (divisionSalaryMap.get(key) ?? 0) + Number(row.amount) || 0);
      }

      // Allocated salary costs map (không có customer_id)
      for (const row of allocatedSalaryRows ?? []) {
        if (!row.division_id) continue;
        const key = `${row.year}_${row.month}_${row.division_id}`;
        divisionSalaryMap.set(key, (divisionSalaryMap.get(key) ?? 0) + Number(row.amount) || 0);
      }

      // Bonus maps
      const bonusByDMap = new Map<string, number>();
      for (const row of bonusByDRows ?? []) {
        bonusByDMap.set(row.division_id, Number(row.bn_bmm) || 0);
      }

      const companyBonusMap = new Map<string, number>();
      for (const row of bonusByCompanyRows ?? []) {
        companyBonusMap.set(row.company_id, Number(row.percent_bn) || 0);
      }

      // Aggregate by period cho overhead calculation
      const salaryByPeriod = new Map<string, number>();
      const costByPeriod = new Map<string, number>();
      const salaryCostByPeriod = new Map<string, number>();
      const revenueByPeriod = new Map<string, number>();
      const bmmByPeriod = new Map<string, number>();

      // Salary costs by period
      for (const [groupKey, salaryAmount] of divisionSalaryMap.entries()) {
        const [year, month] = groupKey.split('_').map(Number);
        const periodKey = `${year}_${month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + salaryAmount);
      }

      // Other costs by period
      for (const row of costRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // Salary cost từ bảng costs
      for (const row of salaryCostRows ?? []) {
        const periodKey = `${row.year}_${row.month}`;
        salaryCostByPeriod.set(periodKey, (salaryCostByPeriod.get(periodKey) ?? 0) + Number(row.cost) || 0);
      }

      // Revenue và BMM by period
      for (const [groupKey, data] of divisionRevenueMap.entries()) {
        const periodKey = `${data.year}_${data.month}`;
        revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + data.totalRevenue);
        bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + data.totalBMM);
      }

      // Tính salary bonus by period (BMM * bn_bmm cho từng division)
      const salaryBonusByPeriod = new Map<string, number>();
      for (const [groupKey, data] of divisionRevenueMap.entries()) {
        const periodKey = `${data.year}_${data.month}`;
        const bnBmm = bonusByDMap.get(data.division_id) ?? 0;
        const salaryBonus = data.totalBMM * bnBmm;
        salaryBonusByPeriod.set(periodKey, (salaryBonusByPeriod.get(periodKey) ?? 0) + salaryBonus);
      }

      // Tính percent_bn từ company để tính bonus cost
      const firstPercentBn = bonusByCompanyRows && bonusByCompanyRows.length > 0 ? Number(bonusByCompanyRows[0].percent_bn) || 0 : 0;

      // Overhead calculation với đầy đủ các thành phần
      const overheadPerBMMByPeriod = new Map<string, number>();
      for (const [periodKey, totalCostFromCosts] of costByPeriod.entries()) {
        const salaryCostFromSalaryCosts = salaryByPeriod.get(periodKey) ?? 0;
        const salaryCostFromCosts = salaryCostByPeriod.get(periodKey) ?? 0;
        const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
        const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
        const salaryBonus = salaryBonusByPeriod.get(periodKey) ?? 0;

        // Tính bonus cost từ percent_bn của company
        const bonusCost = salaryCostFromSalaryCosts * (firstPercentBn / 100);

        // Tính tax cost = 5% profit nếu > 0
        const totalCostBeforeTax = totalCostFromCosts + salaryCostFromSalaryCosts + salaryCostFromCosts + bonusCost;
        const profitBeforeTax = totalRevenue - totalCostBeforeTax;
        const taxCost = profitBeforeTax > 0 ? profitBeforeTax * 0.05 : 0;

        // Tổng overhead
        const totalOverhead = totalCostFromCosts + salaryCostFromCosts + bonusCost + taxCost;
        
        let overheadAvg = 0;
        if (totalBmm !== 0) {
          overheadAvg = (totalOverhead - salaryCostFromSalaryCosts - salaryBonus) / totalBmm;
        }
        overheadPerBMMByPeriod.set(periodKey, overheadAvg);
      }

      // === TẠO FINAL RESULTS ===
      const resultArr: GroupedDivisionData[] = [];

      for (const [groupKey, divisionData] of divisionRevenueMap.entries()) {
        const periodKey = `${divisionData.year}_${divisionData.month}`;
        const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
        const overheadCost = overheadPerBMM * divisionData.totalBMM;

        // Tính bonusValue = BMM * bn_bmm từ bảng bonus_by_d
        const bnBmm = bonusByDMap.get(divisionData.division_id) ?? 0;
        const bonusValue = divisionData.totalBMM * bnBmm;

        // Lấy salary cost cho division này
        const salaryCost = divisionSalaryMap.get(groupKey) || 0;

        resultArr.push({
          year: divisionData.year,
          month: divisionData.month,
          division_id: divisionData.division_id,
          division_code: divisionData.division_code,
          bmm: divisionData.totalBMM,
          revenue: divisionData.totalRevenue,
          salaryCost,
          overheadCost,
          bonusValue,
        });
      }

      // Sắp xếp theo month, division_code
      resultArr.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.division_code.localeCompare(b.division_code);
      });

      setGroupedData(resultArr);
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line
  }, [selectedYear, selectedMonths]);

  return { groupedData, loading };
}
