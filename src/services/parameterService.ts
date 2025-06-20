
import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase
      .from("parameter")
      .select("*")
      .order("year", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  add: async (row: ParameterCreate): Promise<Parameter> => {
    if (
      typeof row.year !== "number" ||
      typeof row.code !== "string" ||
      typeof row.value !== "number"
    ) {
      throw new Error("Missing required fields for creating parameter row.");
    }
    const { data, error } = await supabase
      .from("parameter")
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: Partial<Parameter>): Promise<Parameter> => {
    const { data, error } = await supabase
      .from("parameter")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("parameter").delete().eq("id", id);
    if (error) throw error;
  },
};
