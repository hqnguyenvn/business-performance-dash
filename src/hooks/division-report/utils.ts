
// Helper functions for period keys
export const createPeriodKey = (year: number, month: number) => `${year}_${month}`;
export const createDivisionPeriodKey = (year: number, month: number, divisionId: string) => `${year}_${month}_${divisionId}`;
