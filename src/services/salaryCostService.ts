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

export interface SalaryCostFilters {
  year?: number;
  months?: number[];
}

export interface PaginatedSalaryCostResponse {
  data: SalaryCost[];
  total: number;
}

export const getSalaryCostsPaginated = async (
  page: number = 1,
  pageSize: number = 25,
  filters: SalaryCostFilters = {}
): Promise<PaginatedSalaryCostResponse> => {
  console.log('Fetching salary costs with params:', { ...filters, page, pageSize });
  
  let query = supabase
    .from('salary_costs')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.year) {
    query = query.eq('year', filters.year);
  }
  
  if (filters.months && filters.months.length > 0) {
    query = query.in('month', filters.months);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  query = query
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  
  if (error) {
    console.error("Error fetching paginated salary costs:", error);
    throw error;
  }

  return {
    data: data || [],
    total: count || 0
  };
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
