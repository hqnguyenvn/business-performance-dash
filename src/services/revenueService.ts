
import { supabase } from "@/integrations/supabase/client";

export interface Revenue {
  id: string;
  year: number;
  month: number;
  customer_id?: string;
  company_id?: string;
  division_id?: string;
  project_id?: string;
  project_name: string;
  project_type_id?: string;
  resource_id?: string;
  currency_id?: string;
  unit_price?: number;
  quantity?: number;
  original_amount: number;
  vnd_revenue: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RevenueSearchParams {
  year: number;
  months: number[];
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface RevenueResponse {
  data: Revenue[];
  total: number;
}

export const getRevenues = async (params: RevenueSearchParams): Promise<RevenueResponse> => {
  let query = supabase
    .from('revenues')
    .select('*', { count: 'exact' });

  if (params.year) {
    query = query.eq('year', params.year);
  }

  if (params.months && params.months.length > 0) {
    query = query.in('month', params.months);
  }

  const pageSize = params.pageSize || 10;
  const page = params.page || 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
  };
};

export const createRevenue = async (revenue: Partial<Revenue>): Promise<Revenue> => {
  const { data, error } = await supabase
    .from('revenues')
    .insert(revenue)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateRevenue = async (id: string, revenue: Partial<Revenue>): Promise<Revenue> => {
  const { data, error } = await supabase
    .from('revenues')
    .update(revenue)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteRevenue = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};
