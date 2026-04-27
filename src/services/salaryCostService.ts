import { api } from "@/lib/api";

export interface SalaryCost {
  id: string;
  year: number;
  month: number;
  customer_id?: string;
  company_id: string;
  division_id?: string;
  amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryCostInsert {
  year: number;
  month: number;
  customer_id?: string | null;
  company_id: string | null;
  division_id?: string | null;
  amount: number;
  notes?: string;
}

export interface SalaryCostFilters {
  year: number;
  months: number[];
}

export interface SalaryCostSearchParams extends SalaryCostFilters {
  page?: number;
  pageSize?: number | "all";
}

export interface SalaryCostResponse {
  data: SalaryCost[];
  total: number;
}

export const getSalaryCosts = async (
  params: SalaryCostSearchParams,
): Promise<SalaryCostResponse> => {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.months && params.months.length > 0) {
    qs.set("months", params.months.join(","));
  }
  if (params.pageSize) {
    qs.set("page_size", String(params.pageSize));
    if (params.pageSize !== "all" && params.page) {
      qs.set("page", String(params.page));
    }
  }
  return api.get<SalaryCostResponse>(`/salary-costs?${qs.toString()}`);
};

export const createSalaryCost = async (
  salaryCost: SalaryCostInsert,
): Promise<SalaryCost> => {
  return api.post<SalaryCost>("/salary-costs", salaryCost);
};

export const updateSalaryCost = async (
  id: string,
  salaryCost: Partial<SalaryCost>,
): Promise<SalaryCost> => {
  return api.put<SalaryCost>(`/salary-costs/${id}`, salaryCost);
};

export const deleteSalaryCost = async (id: string): Promise<void> => {
  await api.delete<void>(`/salary-costs/${id}`);
};

export const bulkDeleteSalaryCosts = async (
  year: number,
  months: number[],
): Promise<{ deleted: number }> => {
  return api.post<{ deleted: number }>("/salary-costs/bulk-delete", { year, months });
};

export const batchCreateSalaryCosts = async (
  salaryCosts: SalaryCostInsert[],
): Promise<SalaryCost[]> => {
  if (salaryCosts.length === 0) return [];
  return api.post<SalaryCost[]>("/salary-costs/batch", salaryCosts);
};
