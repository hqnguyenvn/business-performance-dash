
import { supabase } from "@/integrations/supabase/client";

export const fetchDivisionReportData = async (selectedYear: string, selectedMonths: number[]) => {
  try {
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

  // Check for errors
  if (revenueError || salaryError || costError || bonusError) {
    console.error("Database errors:", { revenueError, salaryError, costError, bonusError });
    return {
      revenueData: [],
      salaryData: [],
      costData: [],
      bonusData: [],
      error: revenueError || salaryError || costError || bonusError
    };
  }

  return {
    revenueData: revenueData || [],
    salaryData: salaryData || [],
    costData: costData || [],
    bonusData: bonusData || [],
    error: null
  };
  } catch (error) {
    console.error("Error in fetchDivisionReportData:", error);
    return {
      revenueData: [],
      salaryData: [],
      costData: [],
      bonusData: [],
      error
    };
  }
};

  // Check for errors
  const errors = [
    { data: revenueData, error: revenueError, name: 'revenues' },
    { data: salaryData, error: salaryError, name: 'salary_costs' },
    { data: costData, error: costError, name: 'costs' },
    { data: bonusData, error: bonusError, name: 'bonus_by_d' }
  ];

  for (const { error, name } of errors) {
    if (error) {
      throw new Error(`Failed to fetch ${name}: ${error.message}`);
    }
  }

  return {
    revenueData: revenueData ?? [],
    salaryData: salaryData ?? [],
    costData: costData ?? [],
    bonusData: bonusData ?? []
  };
};
