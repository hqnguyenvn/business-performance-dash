import { api } from "@/lib/api";
import { Revenue, RevenueSearchParams, RevenueResponse } from "@/types/revenue";

export const getRevenues = async (
  params: RevenueSearchParams,
): Promise<RevenueResponse> => {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.months && params.months.length > 0) {
    qs.set("months", params.months.join(","));
  }
  if (params.customer_id) qs.set("customer_id", params.customer_id);
  if (params.company_id) qs.set("company_id", params.company_id);
  if (params.division_id) qs.set("division_id", params.division_id);
  if (params.project_id) qs.set("project_id", params.project_id);
  if (params.project_type_id) qs.set("project_type_id", params.project_type_id);
  if (params.resource_id) qs.set("resource_id", params.resource_id);
  if (params.currency_id) qs.set("currency_id", params.currency_id);
  if (params.q) qs.set("q", params.q);
  if (params.pageSize) {
    qs.set("page_size", String(params.pageSize));
    if (params.pageSize !== "all" && params.page) {
      qs.set("page", String(params.page));
    }
  }
  const res = await api.get<RevenueResponse>(`/revenues?${qs.toString()}`);
  return {
    data: res.data.map((item) => ({ ...item, project_name: item.project_name || "" })),
    total: res.total,
  };
};

export const createRevenue = async (
  revenue: Omit<Revenue, "id">,
): Promise<Revenue> => {
  const data = await api.post<Revenue>("/revenues", revenue);
  return { ...data, project_name: data.project_name || "" };
};

export const updateRevenue = async (
  id: string,
  revenue: Partial<Revenue>,
): Promise<Revenue> => {
  const data = await api.put<Revenue>(`/revenues/${id}`, revenue);
  return { ...data, project_name: data.project_name || "" };
};

export const deleteRevenue = async (id: string): Promise<void> => {
  await api.delete<void>(`/revenues/${id}`);
};

export const bulkDeleteRevenues = async (
  year: number,
  months: number[],
): Promise<{ deleted: number }> => {
  return api.post<{ deleted: number }>("/revenues/bulk-delete", { year, months });
};

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
}

export const batchCreateRevenues = async (
  revenues: Omit<Revenue, "id">[],
): Promise<BatchImportResult> => {
  if (revenues.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }
  return api.post<BatchImportResult>("/revenues/batch", revenues);
};
