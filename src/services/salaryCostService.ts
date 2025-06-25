
import { supabase } from "@/integrations/supabase/client";

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
  pageSize?: number;
}

export interface SalaryCostResponse {
  data: SalaryCost[];
  total: number;
}

export const getSalaryCosts = async (params: SalaryCostSearchParams): Promise<SalaryCostResponse> => {
  let query = supabase.from('salary_costs').select('*', { count: 'exact' });
  
  if (params.year) {
    query = query.eq('year', params.year);
  }
  
  if (params.months && params.months.length > 0) {
    query = query.in('month', params.months);
  }
  
  // Apply pagination
  if (params.pageSize && params.page) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);
  }
  
  query = query.order('year', { ascending: false }).order('month', { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching salary costs:', error);
    throw error;
  }
  
  return {
    data: data || [],
    total: count || 0
  };
};

export const createSalaryCost = async (salaryCost: SalaryCostInsert): Promise<SalaryCost> => {
  const { data, error } = await supabase
    .from('salary_costs')
    .insert(salaryCost)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating salary cost:', error);
    throw error;
  }
  
  return data as SalaryCost;
};

export const updateSalaryCost = async (id: string, salaryCost: Partial<SalaryCost>): Promise<SalaryCost> => {
  const { data, error } = await supabase
    .from('salary_costs')
    .update(salaryCost)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating salary cost:', error);
    throw error;
  }
  
  return data as SalaryCost;
};

export const deleteSalaryCost = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('salary_costs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting salary cost:', error);
    throw error;
  }
};

export const batchCreateSalaryCosts = async (salaryCosts: SalaryCostInsert[]): Promise<SalaryCost[]> => {
  try {
    const batchSize = 100;
    const results: SalaryCost[] = [];
    
    for (let i = 0; i < salaryCosts.length; i += batchSize) {
      const batch = salaryCosts.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('salary_costs')
        .insert(batch)
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        throw error;
      }
      
      if (data) {
        results.push(...data);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch import:', error);
    throw error;
  }
};
