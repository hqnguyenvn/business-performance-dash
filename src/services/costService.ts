
import { supabase } from "@/integrations/supabase/client";

export interface Cost {
  id: string;
  year: number;
  month: number;
  cost_type: string;
  company_id?: string;
  division_id?: string;
  project_id?: string;
  resource_id?: string;
  cost: number;
  description?: string;
  is_cost?: boolean;
  is_checked?: boolean;
  notes?: string;
}

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

  async create(item: Omit<Cost, 'id'>): Promise<Cost> {
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
}

export const costService = new CostService();
