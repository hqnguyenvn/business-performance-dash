

import { GroupedDivisionData } from "./types";

// Helper function to create period keys
const createPeriodKey = (year: number, month: number) => `${year}_${month}`;
const createDivisionPeriodKey = (year: number, month: number, divisionId: string) => `${year}_${month}_${divisionId}`;

// OPTIMIZATION: Memoized calculation functions similar to Company Report
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

export const processDivisionReportData = (
  revenueData: any[],
  salaryData: any[],
  costData: any[],
  bonusData: any[],
  bonusRate: number,
  taxRate: number
): GroupedDivisionData[] => {
  // OPTIMIZATION 3: Process data more efficiently with single-pass algorithms
  const divisionRevenueMap = new Map<string, {
    year: number;
    month: number;
    division_id: string;
    division_code: string;
    totalBMM: number;
    totalRevenue: number;
  }>();

  const revenueByPeriod = new Map<string, number>();
  const bmmByPeriod = new Map<string, number>();

  // Single pass through revenue data
  for (const row of revenueData) {
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
        totalBMM: bmm,
        totalRevenue: revenue,
      });
    }

    // Update period totals
    revenueByPeriod.set(periodKey, (revenueByPeriod.get(periodKey) ?? 0) + revenue);
    bmmByPeriod.set(periodKey, (bmmByPeriod.get(periodKey) ?? 0) + bmm);
  }

  // Process salary costs efficiently
  const divisionSalaryMap = new Map<string, number>();
  const totalSalaryByPeriod = new Map<string, number>();

  for (const row of salaryData) {
    if (!row.division_id) continue;
    const divisionKey = createDivisionPeriodKey(row.year, row.month, row.division_id);
    const periodKey = createPeriodKey(row.year, row.month);
    const amount = Number(row.amount) || 0;

    divisionSalaryMap.set(divisionKey, (divisionSalaryMap.get(divisionKey) ?? 0) + amount);
    totalSalaryByPeriod.set(periodKey, (totalSalaryByPeriod.get(periodKey) ?? 0) + amount);
  }

  // Process costs efficiently
  const costByPeriod = new Map<string, number>();
  const salaryCostByPeriod = new Map<string, number>();

  for (const row of costData) {
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
  for (const row of bonusData) {
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
    revenueByPeriod,
    bmmByPeriod,
    salaryBonusByPeriod,
    totalSalaryByPeriod,
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

  return resultArr;
};

