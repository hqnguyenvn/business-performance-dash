
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

      // 1. Fetch revenues by division
      const { data: rows, error } = await supabase
        .from('revenues')
        .select(
          `
            year,
            month,
            division_id,
            quantity,
            vnd_revenue,
            divisions!revenues_division_id_fkey(code)
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

      // 2. Fetch salary_costs by division
      const { data: salaryRows, error: salaryError } = await supabase
        .from('salary_costs')
        .select(`
          year, month, division_id, amount
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

      // 3. Fetch costs by period
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

      // Aggregate logic by division
      const salaryByPeriod = new Map<string, number>();
      const salaryMap = new Map<string, number>();
      for (const row of salaryRows ?? []) {
        if (!row.division_id) continue;
        const periodKey = `${row.year}_${row.month}`;
        salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + Number(row.amount) || 0);
        const key = `${row.year}_${row.month}_${row.division_id}`;
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

      // --- Group by division ---
      const groupMap = new Map<string, GroupedDivisionData>();
      for (const row of rows ?? []) {
        const groupKey = `${row.year}_${row.month}_${row.division_id}`;
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
          // lấy lương cho division này
          const salaryKey = `${row.year}_${row.month}_${row.division_id}`;
          groupMap.set(groupKey, {
            year: row.year,
            month: row.month,
            division_id: row.division_id,
            division_code: row.divisions?.code || "N/A",
            bmm,
            revenue,
            salaryCost: salaryMap.get(salaryKey) || 0,
            overheadCost,
          });
        }
      }

      // sort by month, division_code
      const resultArr = Array.from(groupMap.values());
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
