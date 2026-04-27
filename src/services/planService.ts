import { api } from "@/lib/api";
import type {
  AnnualPlan,
  AnnualPlanResponse,
  AnnualPlanSearchParams,
} from "@/types/plan";

export type NewAnnualPlan = Omit<AnnualPlan, "id" | "created_at" | "updated_at">;

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
}

export interface BulkUpsertResult {
  created: number;
  updated: number;
  errors: { index: number; error: string }[];
}

function buildQuery(params: AnnualPlanSearchParams): string {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.months && params.months.length > 0) {
    qs.set("months", params.months.join(","));
  }
  if (params.company_id) qs.set("company_id", params.company_id);
  if (params.q) qs.set("q", params.q);
  if (params.pageSize) {
    qs.set("page_size", String(params.pageSize));
    if (params.pageSize !== "all" && params.page) {
      qs.set("page", String(params.page));
    }
  }
  return qs.toString();
}

export const getPlans = async (
  params: AnnualPlanSearchParams,
): Promise<AnnualPlanResponse> => {
  return api.get<AnnualPlanResponse>(`/plans?${buildQuery(params)}`);
};

export const createPlan = async (plan: NewAnnualPlan): Promise<AnnualPlan> => {
  return api.post<AnnualPlan>("/plans", plan);
};

export const updatePlan = async (
  id: string,
  patch: Partial<AnnualPlan>,
): Promise<AnnualPlan> => {
  return api.put<AnnualPlan>(`/plans/${id}`, patch);
};

export const deletePlan = async (id: string): Promise<void> => {
  await api.delete<void>(`/plans/${id}`);
};

export const bulkDeletePlans = async (
  year: number,
  months: number[],
): Promise<{ deleted: number }> => {
  return api.post<{ deleted: number }>("/plans/bulk-delete", { year, months });
};

export const batchCreatePlans = async (
  plans: NewAnnualPlan[],
): Promise<BatchImportResult> => {
  if (plans.length === 0) return { success: 0, failed: 0, errors: [] };
  return api.post<BatchImportResult>("/plans/batch", plans);
};

export const bulkUpsertPlans = async (
  rows: Array<Partial<AnnualPlan> & NewAnnualPlan>,
): Promise<BulkUpsertResult> => {
  return api.post<BulkUpsertResult>("/plans/bulk-upsert", rows);
};
