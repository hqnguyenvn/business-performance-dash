
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useParameterValues } from "@/hooks/useParameterValues";

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
  bonusValue: number;
};

interface UseDivisionReportDataProps {
  selectedYear: string;
  selectedMonths: number[];
}

// Helper functions for period keys
const createPeriodKey = (year: number, month: number) => `${year}_${month}`;
const createDivisionPeriodKey = (year: number, month: number, divisionId: string) => `${year}_${month}_${divisionId}`;

// Memoized calculation function
const calculateOverheadPerBMM = (
  costByPeriod: Map<string, number>,
  salaryCostByPeriod: Map<string, number>,
  salaryByPeriod: Map<string, number>,
  revenueByPeriod: Map<string, number>,
  bmmByPeriod: Map<string, number>,
  salaryBonusByPeriod: Map<string, number>,
  bonusRate: number,
  taxRate: number
) => {
  const overheadPerBMMByPeriod = new Map<string, number>();
  
  for (const [periodKey, totalCostFromCosts] of costByPeriod.entries()) {
    const salaryCostFromSalaryCosts = salaryByPeriod.get(periodKey) ?? 0;
    const salaryCostFromCosts = salaryCostByPeriod.get(periodKey) ?? 0;
    const totalRevenue = revenueByPeriod.get(periodKey) ?? 0;
    const totalBmm = bmmByPeriod.get(periodKey) ?? 0;
    const salaryBonus = salaryBonusByPeriod.get(periodKey) ?? 0;

    // Calculate components using parameters
    const bonusCost = salaryCostFromCosts * bonusRate;
    const profitBeforeTax = totalRevenue - totalCostFromCosts;
    const taxCost = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;
    const totalOverhead = totalCostFromCosts + bonusCost + taxCost - salaryCostFromSalaryCosts - salaryBonus;

    let overheadAvg = 0;
    if (totalBmm !== 0) {
      overheadAvg = totalOverhead / totalBmm;
    }
    overheadPerBMMByPeriod.set(periodKey, overheadAvg);
  }
  
  return overheadPerBMMByPeriod;
};

export function useDivisionReportData({ selectedYear, selectedMonths }: UseDivisionReportDataProps) {
  const { toast } = useToast();
  const [groupedData, setGroupedData] = useState<GroupedDivisionData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get parameter values from database
  const { taxRate, bonusRate } = useParameterValues(parseInt(selectedYear));

  // Memoize the fetch key to prevent unnecessary re-fetches
  const fetchKey = useMemo(() => 
    `${selectedYear}_${selectedMonths.join(',')}_${bonusRate}_${taxRate}`, 
    [selectedYear, selectedMonths, bonusRate, taxRate]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // OPTIMIZATION 1: Combine related queries to reduce parallel requests
        const [
          { data: revenueData, error: revenueError },
          { data: salaryData, error: salaryError },
          { data: costData, error: costError },
          { data: bonusData, error: bonusError }
        ] = await Promise.all([
          // Combined revenue query with divisions
          supabase
            .from('revenues')
            .select(`
              year, month, division_id, quantity, vnd_revenue,
              divisions!revenues_division_id_fkey(code, company_id)
            `)
            .eq('year', Number(selectedYear))
            .in('month', selectedMonths),

          // Combined salary costs query (both with and without customer_id)
          supabase
            .from('salary_costs')
            .select('year, month, division_id, customer_id, amount')
            .eq('year', Number(selectedYear))
            .in('month', selectedMonths),

          // Combined costs query with cost_types lookup
          supabase
            .from('costs')
            .select(`
              year, month, cost, is_cost,
              cost_types!costs_cost_type_fkey(code)
            `)
            .eq('year', Number(selectedYear))
            .in('month', selectedMonths)
            .eq('is_cost', true),

          // Bonus data
          supabase
            .from('bonus_by_d')
            .select('year, division_id, bn_bmm')
            .eq('year', Number(selectedYear))
        ]);

        // OPTIMIZATION 2: Early error handling
        const errors = [
          { data: revenueData, error: revenueError, name: 'revenues' },
          { data: salaryData, error: salaryError, name: 'salary_costs' },
          { data: costData, error: costError, name: 'costs' },
          { data: bonusData, error: bonusError, name: 'bonus_by_d' }
        ];

        for (const { error, name } of errors) {
          if (error) {
            toast({
              variant: "destructive",
              title: "Lỗi lấy dữ liệu",
              description: `Không lấy được dữ liệu ${name}.`,
            });
            setLoading(false);
            return;
          }
        }

        // OPTIMIZATION 3: Process data more efficiently with single-pass algorithms
        const divisionRevenueMap = new Map<string, {
          year: number;
          month: number;
          division_id: string;
          division_code: string;
          totalRevenue: number;
          totalBMM: number;
          company_id: string;
        }>();

        const revenueByPeriod = new Map<string, number>();
        const bmmByPeriod = new Map<string, number>();

        // Single pass through revenue data
        for (const row of revenueData ?? []) {
          const groupKey = createDivisionPeriodKey(row.year, row.month, row.division_id);
          const periodKey = createPeriodKey(row.year, row.month);
          const bmm = Number(row.quantity) || 0;
          const revenue = Number(row.vnd_revenue) || 0;

          // Update division revenue map
          if (divisionRevenueMap.has(groupKey)) {
            const existing = divisionRevenueMap.get(groupKey)!;
            existing.totalBMM += bmm;
            existing.totalRevenue += revenue;
          } else {
            divisionRevenueMap.set(groupKey, {
              year: row.year,
              month: row.month,
              division_id: row.division_id,
              division_code: row.divisions?.code || "N/A",
              totalRevenue: revenue,
              totalBMM: bmm,
              company_id: row.divisions?.company_id || "",
            });
          }

          // Update period totals
          revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + revenue);
          bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + bmm);
        }

        // Process salary costs efficiently
        const divisionSalaryMap = new Map<string, number>();
        const salaryByPeriod = new Map<string, number>();

        for (const row of salaryData ?? []) {
          if (!row.division_id) continue;
          const divisionKey = createDivisionPeriodKey(row.year, row.month, row.division_id);
          const periodKey = createPeriodKey(row.year, row.month);
          const amount = Number(row.amount) || 0;

          divisionSalaryMap.set(divisionKey, (divisionSalaryMap.get(divisionKey) ?? 0) + amount);
          salaryByPeriod.set(periodKey, (salaryByPeriod.get(periodKey) ?? 0) + amount);
        }

        // Process costs efficiently
        const costByPeriod = new Map<string, number>();
        const salaryCostByPeriod = new Map<string, number>();

        for (const row of costData ?? []) {
          const periodKey = createPeriodKey(row.year, row.month);
          const cost = Number(row.cost) || 0;
          
          costByPeriod.set(periodKey, (costByPeriod.get(periodKey) ?? 0) + cost);
          
          // Check if this is salary cost
          if (row.cost_types?.code === 'Salary') {
            salaryCostByPeriod.set(periodKey, (salaryCostByPeriod.get(periodKey) ?? 0) + cost);
          }
        }

        // Create bonus map
        const bonusMap = new Map<string, number>();
        for (const row of bonusData ?? []) {
          bonusMap.set(row.division_id, Number(row.bn_bmm) || 0);
        }

        // Calculate salary bonus by period
        const salaryBonusByPeriod = new Map<string, number>();
        for (const [groupKey, data] of divisionRevenueMap.entries()) {
          const periodKey = createPeriodKey(data.year, data.month);
          const bnBmm = bonusMap.get(data.division_id) || 0;
          const bonusForThisDivision = data.totalBMM * bnBmm;
          salaryBonusByPeriod.set(periodKey, (salaryBonusByPeriod.get(periodKey) ?? 0) + bonusForThisDivision);
        }

        // OPTIMIZATION 4: Use memoized calculation function
        const overheadPerBMMByPeriod = calculateOverheadPerBMM(
          costByPeriod,
          salaryCostByPeriod,
          salaryByPeriod,
          revenueByPeriod,
          bmmByPeriod,
          salaryBonusByPeriod,
          bonusRate,
          taxRate
        );

        // Create final results
        const resultArr: GroupedDivisionData[] = [];

        for (const [groupKey, divisionData] of divisionRevenueMap.entries()) {
          const periodKey = createPeriodKey(divisionData.year, divisionData.month);
          const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
          const overheadCost = overheadPerBMM * divisionData.totalBMM;

          const bnBmm = bonusMap.get(divisionData.division_id) ?? 0;
          const bonusValue = divisionData.totalBMM * bnBmm;
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

        // Sort results
        resultArr.sort((a, b) => {
          if (a.month !== b.month) return a.month - b.month;
          return a.division_code.localeCompare(b.division_code);
        });

        setGroupedData(resultArr);

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lỗi hệ thống",
          description: "Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchKey, toast, bonusRate, taxRate]);

  return { groupedData, loading };
}
