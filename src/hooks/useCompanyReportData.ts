
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

      // 2. Lấy salary_costs: SUM amount by (year, month, company_id)
      const { data: salaryRows, error: salaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, company_id, amount
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
          year, company_id, bn_bmm
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

      // Tạo các bảng tổng hợp lương, chi phí, bmm
      const salaryByPeriod = new Map<string, number>();
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.company_id) continue;
        const periodKey = `${row.year}_${row.month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);
        const key = `${row.year}_${row.month}_${row.company_id}`;
        salaryMap.set(key, (salaryMap.get(key) ?? 0) + Number(row.amount) || 0);
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

      // Tạo map bonus theo company_id
      const bonusMap = new Map<string, number>();
      for (const row of bonusRows ?? []) {
        bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
      }

      // --- Group by company ---
      const groupMap = new Map<string, GroupedCompanyData>();
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

        if (prev) {
          prev.bmm += bmm;
          prev.revenue += revenue;
          prev.overheadCost += overheadCost;
          prev.bonusValue += bonusValue;
        } else {
          // Lấy salary cost cho (year, month, company_id)
          const salaryKey = `${row.year}_${row.month}_${row.company_id}`;
          groupMap.set(groupKey, {
            year: row.year,
            month: row.month,
            company_id: row.company_id,
            company_code: row.companies?.code || "N/A",
            bmm,
            revenue,
            salaryCost: salaryMap.get(salaryKey) || 0,
            overheadCost,
            bonusValue,
          });
        }
      }

      // -- Sắp xếp theo month, company_code --
      const resultArr = Array.from(groupMap.values());
      resultArr.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.company_code.localeCompare(b.company_code);
      });
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
