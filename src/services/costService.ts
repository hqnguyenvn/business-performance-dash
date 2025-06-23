import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Cost = Database['public']['Tables']['costs']['Row'];
export type NewCost = Database['public']['Tables']['costs']['Insert'];

export class CostService {
  async getAll(): Promise<Cost[]> {
    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) {
      console.error('Error fetching costs:', error);
      throw error;
    }
    
    return data || [];
  }

  async getPaginated(params: {
    year?: number;
    months?: number[];
    page: number;
    pageSize: number;
  }): Promise<{ data: Cost[]; totalCount: number }> {
    console.log("Fetching costs with params:", params);
    
    let query = supabase.from('costs').select('*', { count: 'exact' });
    
    // Apply filters
    if (params.year) {
      query = query.eq('year', params.year);
    }
    
    if (params.months && params.months.length > 0) {
      query = query.in('month', params.months);
    }
    
    // Apply pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    
    query = query
      .range(from, to)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching paginated costs:', error);
      throw error;
    }
    
    return { 
      data: data || [], 
      totalCount: count || 0 
    };
  }

  async create(item: NewCost): Promise<Cost> {
    const { data, error } = await supabase
      .from('costs')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating cost:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<Cost>): Promise<Cost> {
    const { data, error } = await supabase
      .from('costs')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating cost:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('costs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting cost:', error);
      throw error;
    }
  }

  async getByFilters(filters: {
    year?: number;
    month?: number;
    cost_type?: string;
    company_id?: string;
  }): Promise<Cost[]> {
    let query = supabase.from('costs').select('*');
    
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.month) query = query.eq('month', filters.month);
    if (filters.cost_type) query = query.eq('cost_type', filters.cost_type);
    if (filters.company_id) query = query.eq('company_id', filters.company_id);
    
    const { data, error } = await query.order('year', { ascending: false });
    
    if (error) {
      console.error('Error fetching filtered costs:', error);
      throw error;
    }
    
    return data || [];
  }

  async batchCreate(costs: NewCost[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      console.log("🚀 Bắt đầu batch import costs qua Supabase");
      console.log("📦 Số lượng records:", costs.length);
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ index: number; error: string }>
      };

      // Process in batches of 100 to avoid hitting Supabase limits
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
  }
}

export const costService = new CostService();
