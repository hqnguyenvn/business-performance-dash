import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type SalaryCost = Tables<'salary_costs'>;
export type SalaryCostInsert = TablesInsert<'salary_costs'>;
export type SalaryCostUpdate = TablesUpdate<'salary_costs'>;

export const getSalaryCosts = async (): Promise<SalaryCost[]> => {
  const { data, error } = await supabase.from('salary_costs').select('*').order('year, month');
  if (error) {
    console.error("Error fetching salary costs:", error);
    throw error;
  }
  return data || [];
};

export const upsertSalaryCosts = async (costs: SalaryCostInsert[]) => {
    const { data, error } = await supabase.from('salary_costs').upsert(costs).select();
    if (error) {
      console.error("Error upserting salary costs:", error);
      throw error;
    }
    return data;
};

export const deleteSalaryCosts = async (ids: string[]) => {
    const { error } = await supabase.from('salary_costs').delete().in('id', ids);
    if (error) {
      console.error("Error deleting salary costs:", error);
      throw error;
    }
    return true;
};
