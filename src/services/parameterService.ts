import { api } from "@/lib/api";

export interface Parameter {
  id: string;
  year: number;
  code: string;
  value: number;
  descriptions?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ParameterCreate = {
  year: number;
  code: string;
  value: number;
  descriptions?: string | null;
};

export const parameterService = {
  getAll: async (): Promise<Parameter[]> => {
    return api.get<Parameter[]>("/parameters");
  },
  add: async (row: ParameterCreate): Promise<Parameter> => {
    if (
      typeof row.year !== "number" ||
      typeof row.code !== "string" ||
      typeof row.value !== "number"
    ) {
      throw new Error("Missing required fields for creating parameter row.");
    }
    return api.post<Parameter>("/parameters", row);
  },
  update: async (
    id: string,
    updates: Partial<Parameter>,
  ): Promise<Parameter> => {
    if (updates.value !== undefined) {
      updates.value = Number(updates.value);
      if (isNaN(updates.value)) {
        throw new Error("Invalid decimal value for parameter");
      }
    }
    return api.put<Parameter>(`/parameters/${id}`, updates);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete<void>(`/parameters/${id}`);
  },
};
