import { api } from "@/lib/api";

export interface BonusByDivision {
  id: string;
  year: number;
  division_id: string;
  bn_bmm: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BonusByDivisionCreate = {
  year: number;
  division_id: string;
  bn_bmm: number;
  notes?: string | null;
};

export const bonusByDivisionService = {
  getAll: async (): Promise<BonusByDivision[]> => {
    return api.get<BonusByDivision[]>("/bonus-by-d");
  },
  add: async (row: BonusByDivisionCreate): Promise<BonusByDivision> => {
    if (
      typeof row.year !== "number" ||
      typeof row.division_id !== "string" ||
      typeof row.bn_bmm !== "number"
    ) {
      throw new Error("Missing required fields for creating bonus_by_d row.");
    }
    return api.post<BonusByDivision>("/bonus-by-d", row);
  },
  update: async (
    id: string,
    updates: Partial<BonusByDivision>,
  ): Promise<BonusByDivision> => {
    return api.put<BonusByDivision>(`/bonus-by-d/${id}`, updates);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete<void>(`/bonus-by-d/${id}`);
  },
};
