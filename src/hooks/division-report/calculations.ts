
// Memoized calculation function for overhead per BMM
export const calculateOverheadPerBMM = (
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
