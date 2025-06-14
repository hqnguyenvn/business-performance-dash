
import { supabase } from "@/integrations/supabase/client";
import { Revenue } from '@/types/revenue';
import { createRevenue, updateRevenue, deleteRevenue } from "./revenueApi";

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
    
    return (data || []).map(item => ({
      ...item,
      project_name: item.project_name || ''
    })) as Revenue[];
  }

  async create(item: Omit<Revenue, 'id'>): Promise<Revenue> {
    return createRevenue(item);
  }

  async update(id: string, item: Partial<Revenue>): Promise<Revenue> {
    return updateRevenue(id, item);
  }

  async delete(id: string): Promise<void> {
    return deleteRevenue(id);
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
    
    return (data || []).map(item => ({
      ...item,
      project_name: item.project_name || ''
    })) as Revenue[];
  }
}

export const revenueService = new RevenueService();
