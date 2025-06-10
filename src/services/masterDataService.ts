
import { supabase } from "@/integrations/supabase/client";

export interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
  company_id?: string;
  customer_id?: string;
}

// Generic CRUD operations for master data tables
export class MasterDataService {
  constructor(private tableName: string) {}

  async getAll(): Promise<MasterData[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('code');
    
    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>): Promise<MasterData> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>): Promise<MasterData> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }
}

// Specific services for each master data table
export const customersService = new MasterDataService('customers');
export const companiesService = new MasterDataService('companies');
export const divisionsService = new MasterDataService('divisions');
export const projectsService = new MasterDataService('projects');
export const projectTypesService = new MasterDataService('project_types');
export const resourcesService = new MasterDataService('resources');
export const currenciesService = new MasterDataService('currencies');
