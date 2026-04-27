import { api } from "@/lib/api";

export interface Cost {
  id: string;
  year: number;
  month: number;
  cost: number;
  cost_type: string;
  company_id: string | null;
  division_id: string | null;
  project_id: string | null;
  resource_id: string | null;
  price: number | null;
  volume: number | null;
  is_checked: boolean | null;
  is_cost: boolean | null;
  description: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NewCost {
  year: number;
  month: number;
  cost: number;
  cost_type?: string;
  company_id?: string | null;
  division_id?: string | null;
  project_id?: string | null;
  resource_id?: string | null;
  price?: number | null;
  volume?: number | null;
  is_checked?: boolean | null;
  is_cost?: boolean | null;
  description?: string | null;
  notes?: string | null;
}

export interface CostSearchParams {
  year?: number;
  months?: number[];
  cost_type?: string;
  company_id?: string;
  page?: number;
  pageSize?: number | "all";
  q?: string;
}

export interface CostResponse {
  data: Cost[];
  total: number;
}

export const getCosts = async (
  params: CostSearchParams,
): Promise<CostResponse> => {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.months && params.months.length > 0) {
    qs.set("months", params.months.join(","));
  }
  if (params.cost_type) qs.set("cost_type", params.cost_type);
  if (params.company_id) qs.set("company_id", params.company_id);
  if (params.q) qs.set("q", params.q);
  if (params.pageSize) {
    qs.set("page_size", String(params.pageSize));
    if (params.pageSize !== "all" && params.page) {
      qs.set("page", String(params.page));
    }
  }
  return api.get<CostResponse>(`/costs?${qs.toString()}`);
};

export const createCost = async (cost: NewCost): Promise<Cost> => {
  return api.post<Cost>("/costs", cost);
};

export const updateCost = async (
  id: string,
  cost: Partial<Cost>,
): Promise<Cost> => {
  return api.put<Cost>(`/costs/${id}`, cost);
};

export const deleteCost = async (id: string): Promise<void> => {
  await api.delete<void>(`/costs/${id}`);
};

export const bulkDeleteCosts = async (
  year: number,
  months: number[],
): Promise<{ deleted: number }> => {
  return api.post<{ deleted: number }>("/costs/bulk-delete", { year, months });
};

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
}

export const batchCreateCosts = async (
  costs: NewCost[],
): Promise<BatchImportResult> => {
  if (costs.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }
  return api.post<BatchImportResult>("/costs/batch", costs);
};

// Prefetching utility for pagination optimization
export const prefetchCosts = async (
  params: CostSearchParams,
  nextPage: number,
): Promise<void> => {
  const prefetchParams = { ...params, page: nextPage };
  try {
    await getCosts(prefetchParams);
  } catch (error) {
    console.debug("Prefetch failed:", error);
  }
};
