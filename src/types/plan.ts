export interface AnnualPlan {
  id: string;
  year: number;
  month: number;
  company_id: string;
  bmm: number;
  revenue: number;
  currency_id?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AnnualPlanSearchParams {
  year?: number;
  months?: number[];
  company_id?: string;
  q?: string;
  page?: number;
  pageSize?: number | "all";
}

export interface AnnualPlanResponse {
  data: AnnualPlan[];
  total: number;
}
