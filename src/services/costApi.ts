
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Cost = Database['public']['Tables']['costs']['Row'];
export type NewCost = Database['public']['Tables']['costs']['Insert'];

export interface CostSearchParams {
  year?: number;
  months?: number[];
  cost_type?: string;
  company_id?: string;
  page?: number;
  pageSize?: number | 'all';
  q?: string;
}

export interface CostResponse {
  data: Cost[];
  total: number;
}

export const getCosts = async (params: CostSearchParams): Promise<CostResponse> => {
  let query = supabase.from('costs').select('*', { count: 'exact' });
  
  // Apply filters with optimized query building
  if (params.year) {
    query = query.eq('year', params.year);
  }
  
  if (params.months && params.months.length > 0) {
    query = query.in('month', params.months);
  }
  
  if (params.cost_type) {
    query = query.eq('cost_type', params.cost_type);
  }
  
  if (params.company_id) {
    query = query.eq('company_id', params.company_id);
  }
  
  if (params.q) {
    query = query.ilike('description', `%${params.q}%`);
  }
  
  // Apply pagination with prefetching optimization
  if (params.pageSize && params.pageSize !== 'all') {
    const pageSize = typeof params.pageSize === 'number' ? params.pageSize : 25;
    const page = params.page || 1;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
  }
  
  // Optimized ordering for better index usage
  query = query
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching costs:', error);
    throw error;
  }
  
  return {
    data: data || [],
    total: count || 0
  };
};

export const createCost = async (cost: NewCost): Promise<Cost> => {
  const { data, error } = await supabase
    .from('costs')
    .insert(cost)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating cost:', error);
    throw error;
  }
  
  return data;
};

export const updateCost = async (id: string, cost: Partial<Cost>): Promise<Cost> => {
  const { data, error } = await supabase
    .from('costs')
    .update(cost)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating cost:', error);
    throw error;
  }
  
  return data;
};

export const deleteCost = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('costs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting cost:', error);
    throw error;
  }
};

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
}

export const batchCreateCosts = async (costs: NewCost[]): Promise<BatchImportResult> => {
  try {
    console.log("🚀 Bắt đầu batch import costs qua optimized API");
    console.log("📦 Số lượng records:", costs.length);
    
    const results: BatchImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Optimized batch processing with smart sizing
    const batchSize = 100;
    
    for (let i = 0; i < costs.length; i += batchSize) {
      const batch = costs.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('costs')
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
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} thành công: ${data?.length || batch.length} records`);
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

    console.log("🎯 Optimized batch import hoàn tất:", results);
    return results;
  } catch (error) {
    console.error('Error in optimized batch import:', error);
    throw error;
  }
};

// Prefetching utility for pagination optimization
export const prefetchCosts = async (params: CostSearchParams, nextPage: number): Promise<void> => {
  const prefetchParams = {
    ...params,
    page: nextPage
  };
  
  try {
    await getCosts(prefetchParams);
  } catch (error) {
    // Silent fail for prefetching
    console.debug('Prefetch failed:', error);
  }
};
