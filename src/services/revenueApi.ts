
import { supabase } from "@/integrations/supabase/client";
import { Revenue, RevenueSearchParams, RevenueResponse } from '@/types/revenue';

export const getRevenues = async (params: RevenueSearchParams): Promise<RevenueResponse> => {
  let query = supabase.from('revenues').select('*', { count: 'exact' });
  
  if (params.year) {
    query = query.eq('year', params.year);
  }
  
  if (params.months && params.months.length > 0) {
    query = query.in('month', params.months);
  }
  
  if (params.customer_id) {
    query = query.eq('customer_id', params.customer_id);
  }
  
  if (params.company_id) {
    query = query.eq('company_id', params.company_id);
  }
  
  if (params.division_id) {
    query = query.eq('division_id', params.division_id);
  }
  
  if (params.project_id) {
    query = query.eq('project_id', params.project_id);
  }
  
  if (params.project_type_id) {
    query = query.eq('project_type_id', params.project_type_id);
  }
  
  if (params.resource_id) {
    query = query.eq('resource_id', params.resource_id);
  }
  
  if (params.currency_id) {
    query = query.eq('currency_id', params.currency_id);
  }
  
  if (params.q) {
    query = query.ilike('notes', `%${params.q}%`);
  }
  
  // Only apply pagination if pageSize is a number and not 'all'
  if (params.pageSize && params.pageSize !== 'all') {
    const pageSize = typeof params.pageSize === 'number' ? params.pageSize : 10;
    const page = params.page || 1;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
  }
  
  query = query.order('year', { ascending: false }).order('month', { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching revenues:', error);
    throw error;
  }
  
  return {
    data: (data || []).map(item => ({
      ...item,
      project_name: item.project_name || ''
    })) as Revenue[],
    total: count || 0
  };
};

export const createRevenue = async (revenue: Omit<Revenue, 'id'>): Promise<Revenue> => {
  const { data, error } = await supabase
    .from('revenues')
    .insert(revenue)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating revenue:', error);
    throw error;
  }
  
  return {
    ...data,
    project_name: data.project_name || ''
  } as Revenue;
};

export const updateRevenue = async (id: string, revenue: Partial<Revenue>): Promise<Revenue> => {
  const { data, error } = await supabase
    .from('revenues')
    .update(revenue)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating revenue:', error);
    throw error;
  }
  
  return {
    ...data,
    project_name: data.project_name || ''
  } as Revenue;
};

export const deleteRevenue = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting revenue:', error);
    throw error;
  }
};

export interface BatchImportResult {
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
}

export const batchCreateRevenues = async (revenues: Omit<Revenue, 'id'>[]): Promise<BatchImportResult> => {
  try {
    console.log("🚀 Bắt đầu batch import qua Supabase");
    console.log("📦 Số lượng records:", revenues.length);
    
    const results: BatchImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process in batches of 100 to avoid hitting Supabase limits
    const batchSize = 100;
    
    for (let i = 0; i < revenues.length; i += batchSize) {
      const batch = revenues.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('revenues')
          .insert(batch)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          // Mark all items in this batch as failed
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

    console.log("🎯 Batch import hoàn tất:", results);
    return results;
  } catch (error) {
    console.error('Error in batch import:', error);
    throw error;
  }
};
