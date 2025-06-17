
import { supabase } from "@/integrations/supabase/client";

export interface BonusByCompany {
  id: string;
  year: number;
  company_id: string;
  bn_bmm: number;
  percent_bn: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BonusByCompanyInsert {
  year: number;
  company_id: string;
  bn_bmm: number;
  percent_bn: number;
  notes?: string;
}

export interface BonusByCompanyUpdate {
  [key: string]: any;
}

class BonusByCompanyService {
  async getAll(): Promise<BonusByCompany[]> {
    const { data, error } = await supabase
      .from('bonus_by_c')
      .select('*')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bonus by company: ${error.message}`);
    }

    return data || [];
  }

  async add(bonus: BonusByCompanyInsert): Promise<BonusByCompany> {
    const { data, error } = await supabase
      .from('bonus_by_c')
      .insert(bonus)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bonus by company: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updates: BonusByCompanyUpdate): Promise<BonusByCompany> {
    const { data, error } = await supabase
      .from('bonus_by_c')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update bonus by company: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('bonus_by_c')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete bonus by company: ${error.message}`);
    }
  }
}

export const bonusByCompanyService = new BonusByCompanyService();
