
export interface Revenue {
  id: string;
  year: number;
  month: number;
  customer_id?: string;
  company_id?: string;
  division_id?: string;
  project_id?: string;
  project_type_id?: string;
  resource_id?: string;
  currency_id?: string;
  unit_price?: number;
  quantity?: number;
  original_amount: number;
  vnd_revenue: number;
  notes?: string;
  project_name?: string;
}

export interface RevenueSearchParams {
  year?: number;
  months?: number[];
  customer_id?: string;
  company_id?: string;
  division_id?: string;
  project_id?: string;
  project_type_id?: string;
  resource_id?: string;
  currency_id?: string;
  page?: number;
  pageSize?: number | 'all';
  q?: string;
}

export interface RevenueResponse {
  data: Revenue[];
  total: number;
}
