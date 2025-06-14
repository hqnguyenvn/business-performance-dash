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
  project_name?: string;
}

export interface RevenueSearchParams {
  year?: number;
  months?: number[];
  customer_id?: string;
  company_id?: string;
  division_id?: string;
  project_id?: string;
  project_type_id?: string;
  resource_id?: string;
  currency_id?: string;
  page?: number;
  pageSize?: number | 'all';
  q?: string;
}

export interface RevenueResponse {
  data: Revenue[];
  total: number;
}

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
  
  const pageSize = params.pageSize || 10;
  const page = params.page || 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  query = query.range(from, to);
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
