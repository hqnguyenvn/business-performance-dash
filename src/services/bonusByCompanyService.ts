import { api } from "@/lib/api";

export interface BonusByCompany {
  id: string;
  year: number;
  company_id: string;
  bn_bmm: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BonusByCompanyInsert {
  year: number;
  company_id: string;
  bn_bmm: number;
  notes?: string;
}

export interface BonusByCompanyUpdate {
  [key: string]: unknown;
}

class BonusByCompanyService {
  async getAll(): Promise<BonusByCompany[]> {
    return api.get<BonusByCompany[]>("/bonus-by-c");
  }

  async add(bonus: BonusByCompanyInsert): Promise<BonusByCompany> {
    return api.post<BonusByCompany>("/bonus-by-c", bonus);
  }

  async update(
    id: string,
    updates: BonusByCompanyUpdate,
  ): Promise<BonusByCompany> {
    return api.put<BonusByCompany>(`/bonus-by-c/${id}`, updates);
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/bonus-by-c/${id}`);
  }
}

export const bonusByCompanyService = new BonusByCompanyService();
