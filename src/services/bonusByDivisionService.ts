
import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase
      .from("bonus_by_d")
      .select("*")
      .order("year", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  add: async (row: BonusByDivisionCreate): Promise<BonusByDivision> => {
    if (
      typeof row.year !== "number" ||
      typeof row.division_id !== "string" ||
      typeof row.bn_bmm !== "number"
    ) {
      throw new Error("Missing required fields for creating bonus_by_d row.");
    }
    const { data, error } = await supabase
      .from("bonus_by_d")
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: Partial<BonusByDivision>): Promise<BonusByDivision> => {
    const { data, error } = await supabase
      .from("bonus_by_d")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("bonus_by_d").delete().eq("id", id);
    if (error) throw error;
  },
};
