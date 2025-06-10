
import { supabase } from "@/integrations/supabase/client";

export interface Revenue {
  id: string;
  year: number;
  month: number;
  customer_id?: string;
  company_id?: string;
  division_id?: string;
  project_id?: string;
  project_type_id?: string;
  resource_id?: string;
  currency_id?: string;
  unit_price?: number;
  quantity?: number;
  original_amount: number;
  vnd_revenue: number;
  notes?: string;
}

export class RevenueService {
  async getAll(): Promise<Revenue[]> {
    const { data, error } = await supabase
      .from('revenues')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) {
      console.error('Error fetching revenues:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<Revenue, 'id'>): Promise<Revenue> {
    const { data, error } = await supabase
      .from('revenues')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating revenue:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<Revenue>): Promise<Revenue> {
    const { data, error } = await supabase
      .from('revenues')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating revenue:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('revenues')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting revenue:', error);
      throw error;
    }
  }

  async getByFilters(filters: {
    year?: number;
    month?: number;
    customer_id?: string;
    project_id?: string;
  }): Promise<Revenue[]> {
    let query = supabase.from('revenues').select('*');
    
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.month) query = query.eq('month', filters.month);
    if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
    if (filters.project_id) query = query.eq('project_id', filters.project_id);
    
    const { data, error } = await query.order('year', { ascending: false });
    
    if (error) {
      console.error('Error fetching filtered revenues:', error);
      throw error;
    }
    
    return data || [];
  }
}

export const revenueService = new RevenueService();
