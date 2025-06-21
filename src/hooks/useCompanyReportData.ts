
import { useEffect, useState, useMemo } from "react";
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
  bonusValue: number;
};

interface UseCompanyReportDataProps {
  selectedYear: string;
  selectedMonths: number[];
}

// Helper function to create period keys
const createPeriodKey = (year: number, month: number) => `${year}_${month}`;
const createCompanyPeriodKey = (year: number, month: number, companyId: string) => `${year}_${month}_${companyId}`;

// Memoized calculation functions
const calculateOverheadPerBMM = (
  costByPeriod: Map<string, number>,
  salaryCostByPeriod: Map<string, number>,
  revenueByPeriod: Map<string, number>,
  bmmByPeriod: Map<string, number>,
  salaryBonusByPeriod: Map<string, number>,
  totalSalaryByPeriod: Map<string, number>,
  bonusRate: number,
  taxRate: number
) => {
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
  }
  
  return overheadPerBMMByPeriod;
};

export function useCompanyReportData({ selectedYear, selectedMonths }: UseCompanyReportDataProps) {
  const { toast } = useToast();
  const [groupedData, setGroupedData] = useState<GroupedCompanyData[]>([]);
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
      console.log('🚀 Starting Company Report data fetch...');

      try {
        // OPTIMIZATION 1: Reduce parallel queries by combining related queries
        const [
          { data: revenueData, error: revenueError },
          { data: salaryData, error: salaryError },
          { data: costData, error: costError },
          { data: bonusData, error: bonusError }
        ] = await Promise.all([
          // Combined revenue query with companies
          supabase
            .from('revenues')
            .select(`
              year, month, company_id, quantity, vnd_revenue,
              companies!revenues_company_id_fkey(code)
            `)
            .eq('year', Number(selectedYear))
            .in('month', selectedMonths),

          // Combined salary costs query (both with and without customer_id)
          supabase
            .from('salary_costs')
            .select('year, month, company_id, customer_id, amount')
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
            .from('bonus_by_c')
            .select('year, company_id, bn_bmm')
            .eq('year', Number(selectedYear))
        ]);

        // OPTIMIZATION 2: Early error handling
        const errors = [
          { data: revenueData, error: revenueError, name: 'revenues' },
          { data: salaryData, error: salaryError, name: 'salary_costs' },
          { data: costData, error: costError, name: 'costs' },
          { data: bonusData, error: bonusError, name: 'bonus_by_c' }
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

        console.log('📊 Data fetched successfully, processing...');

        // OPTIMIZATION 3: Process data more efficiently with single-pass algorithms
        const companyRevenueMap = new Map<string, {
          year: number;
          month: number;
          company_id: string;
          company_code: string;
          totalBMM: number;
          totalRevenue: number;
        }>();

        const revenueByPeriod = new Map<string, number>();
        const bmmByPeriod = new Map<string, number>();

        // Single pass through revenue data
        for (const row of revenueData ?? []) {
          const groupKey = createCompanyPeriodKey(row.year, row.month, row.company_id);
          const periodKey = createPeriodKey(row.year, row.month);
          const bmm = Number(row.quantity) || 0;
          const revenue = Number(row.vnd_revenue) || 0;

          // Update company revenue map
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

          // Update period totals
          revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + revenue);
          bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + bmm);
        }

        // Process salary costs efficiently
        const companySalaryMap = new Map<string, number>();
        const totalSalaryByPeriod = new Map<string, number>();

        for (const row of salaryData ?? []) {
          if (!row.company_id) continue;
          const companyKey = createCompanyPeriodKey(row.year, row.month, row.company_id);
          const periodKey = createPeriodKey(row.year, row.month);
          const amount = Number(row.amount) || 0;

          companySalaryMap.set(companyKey, (companySalaryMap.get(companyKey) ?? 0) + amount);
          totalSalaryByPeriod.set(periodKey, (totalSalaryByPeriod.get(periodKey) ?? 0) + amount);
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
          bonusMap.set(row.company_id, Number(row.bn_bmm) || 0);
        }

        // Calculate salary bonus by period
        const salaryBonusByPeriod = new Map<string, number>();
        for (const [groupKey, data] of companyRevenueMap.entries()) {
          const periodKey = createPeriodKey(data.year, data.month);
          const bnBmm = bonusMap.get(data.company_id) || 0;
          const bonusForThisCompany = data.totalBMM * bnBmm;
          salaryBonusByPeriod.set(periodKey, (salaryBonusByPeriod.get(periodKey) ?? 0) + bonusForThisCompany);
        }

        // OPTIMIZATION 4: Use memoized calculation function
        const overheadPerBMMByPeriod = calculateOverheadPerBMM(
          costByPeriod,
          salaryCostByPeriod,
          revenueByPeriod,
          bmmByPeriod,
          salaryBonusByPeriod,
          totalSalaryByPeriod,
          bonusRate,
          taxRate
        );

        // Create final results
        const resultArr: GroupedCompanyData[] = [];

        for (const [groupKey, companyData] of companyRevenueMap.entries()) {
          const periodKey = createPeriodKey(companyData.year, companyData.month);
          const overheadPerBMM = overheadPerBMMByPeriod.get(periodKey) ?? 0;
          const overheadCost = overheadPerBMM * companyData.totalBMM;

          const bnBmm = bonusMap.get(companyData.company_id) ?? 0;
          const bonusValue = companyData.totalBMM * bnBmm;
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

        // Sort results
        resultArr.sort((a, b) => {
          if (a.month !== b.month) return a.month - b.month;
          return a.company_code.localeCompare(b.company_code);
        });

        console.log('✅ Company Report data processing completed');
        setGroupedData(resultArr);

      } catch (error) {
        console.error('❌ Error in Company Report data fetch:', error);
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

  return {
    groupedData,
    loading,
  };
}
