
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

  // Ensure project_name is properly handled
  const processedData = (data || []).map(item => ({
    ...item,
    project_name: item.project_name || ''
  })) as Revenue[];

  return {
    data: processedData,
    total: count || 0,
  };
};

export const createRevenue = async (revenue: Partial<Revenue>): Promise<Revenue> => {
  // Extract only the fields that exist in the database
  const {
    company_id,
    currency_id,
    customer_id,
    division_id,
    month,
    notes,
    original_amount,
    project_id,
    project_name,
    project_type_id,
    quantity,
    resource_id,
    unit_price,
    vnd_revenue,
    year
  } = revenue;

  const insertData = {
    company_id,
    currency_id,
    customer_id,
    division_id,
    month: month!,
    notes,
    original_amount: original_amount!,
    project_id,
    project_name: project_name || '',
    project_type_id,
    quantity,
    resource_id,
    unit_price,
    vnd_revenue: vnd_revenue!,
    year: year!
  };

  const { data, error } = await supabase
    .from('revenues')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    project_name: data.project_name || ''
  } as Revenue;
};

export const updateRevenue = async (id: string, revenue: Partial<Revenue>): Promise<Revenue> => {
  // Extract only the fields that exist in the database
  const {
    company_id,
    currency_id,
    customer_id,
    division_id,
    month,
    notes,
    original_amount,
    project_id,
    project_name,
    project_type_id,
    quantity,
    resource_id,
    unit_price,
    vnd_revenue,
    year
  } = revenue;

  const updateData: any = {};
  
  if (company_id !== undefined) updateData.company_id = company_id;
  if (currency_id !== undefined) updateData.currency_id = currency_id;
  if (customer_id !== undefined) updateData.customer_id = customer_id;
  if (division_id !== undefined) updateData.division_id = division_id;
  if (month !== undefined) updateData.month = month;
  if (notes !== undefined) updateData.notes = notes;
  if (original_amount !== undefined) updateData.original_amount = original_amount;
  if (project_id !== undefined) updateData.project_id = project_id;
  if (project_name !== undefined) updateData.project_name = project_name;
  if (project_type_id !== undefined) updateData.project_type_id = project_type_id;
  if (quantity !== undefined) updateData.quantity = quantity;
  if (resource_id !== undefined) updateData.resource_id = resource_id;
  if (unit_price !== undefined) updateData.unit_price = unit_price;
  if (vnd_revenue !== undefined) updateData.vnd_revenue = vnd_revenue;
  if (year !== undefined) updateData.year = year;

  const { data, error } = await supabase
    .from('revenues')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
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
    throw error;
  }
};
