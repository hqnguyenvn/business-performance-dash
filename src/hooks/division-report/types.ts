
export interface GroupedDivisionData {
  year: number;
  month: number;
  division_id: string;
  division_code: string;
  bmm: number;
  revenue: number;
  salaryCost: number;
  overheadCost: number;
  bonusValue: number;
}

export interface UseDivisionReportDataProps {
  selectedYear: string;
  selectedMonths: number[];
}
