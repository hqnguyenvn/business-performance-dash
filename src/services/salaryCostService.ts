
import { supabase } from "@/integrations/supabase/client";

export interface SalaryCost {
  id: string;
  year: number;
  month: string;
  company_id?: string;
  division?: string;
  customer_id?: string;
  amount: number;
  notes?: string;
}

export class SalaryCostService {
  async getAll(): Promise<SalaryCost[]> {
    const { data, error } = await supabase
      .from('salary_costs')
      .select('*')
      .order('year', { ascending: false });
    
    if (error) {
      console.error('Error fetching salary costs:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<SalaryCost, 'id'>): Promise<SalaryCost> {
    const { data, error } = await supabase
      .from('salary_costs')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating salary cost:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<SalaryCost>): Promise<SalaryCost> {
    const { data, error } = await supabase
      .from('salary_costs')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating salary cost:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('salary_costs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting salary cost:', error);
      throw error;
    }
  }

  async getByFilters(filters: {
    year?: number;
    month?: string;
    company_id?: string;
  }): Promise<SalaryCost[]> {
    let query = supabase.from('salary_costs').select('*');
    
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.month) query = query.eq('month', filters.month);
    if (filters.company_id) query = query.eq('company_id', filters.company_id);
    
    const { data, error } = await query.order('year', { ascending: false });
    
    if (error) {
      console.error('Error fetching filtered salary costs:', error);
      throw error;
    }
    
    return data || [];
  }
}

export const salaryCostService = new SalaryCostService();
