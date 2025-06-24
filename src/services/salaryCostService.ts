
import { supabase } from "@/integrations/supabase/client";

export interface SalaryCost {
  id: string;
  year: number;
  month: number;
  customer_id?: string;
  company_id: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
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

export const createSalaryCost = async (salaryCost: Omit<SalaryCost, 'id'>): Promise<SalaryCost> => {
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

export const batchCreateSalaryCosts = async (salaryCosts: Omit<SalaryCost, 'id'>[]): Promise<{ success: number; failed: number; errors: any[] }> => {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const batchSize = 100;
    
    for (let i = 0; i < salaryCosts.length; i += batchSize) {
      const batch = salaryCosts.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('salary_costs')
          .insert(batch)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          results.failed += batch.length;
          batch.forEach((_, index) => {
            results.errors.push({
              index: i + index,
              error: `Database error: ${error.message}`
            });
          });
        } else {
          results.success += data?.length || batch.length;
        }
      } catch (batchError) {
        console.error('Batch processing error:', batchError);
        results.failed += batch.length;
        batch.forEach((_, index) => {
          results.errors.push({
            index: i + index,
            error: `Batch error: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
          });
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch import:', error);
    throw error;
  }
};
