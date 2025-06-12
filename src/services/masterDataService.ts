import { supabase } from "@/integrations/supabase/client";

export interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
  company_id?: string;
  customer_id?: string;
}

// Customers Service
export class CustomersService {
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('customers')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
}

// Companies Service
export class CompaniesService {
  async getAll() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating company:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('companies')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating company:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }
}

// Divisions Service
export class DivisionsService {
  async getAll() {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching divisions:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('divisions')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating division:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('divisions')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating division:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('divisions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting division:', error);
      throw error;
    }
  }
}

// Projects Service
export class ProjectsService {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('projects')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
}

// Project Types Service
export class ProjectTypesService {
  async getAll() {
    const { data, error } = await supabase
      .from('project_types')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching project types:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('project_types')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project type:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('project_types')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating project type:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('project_types')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project type:', error);
      throw error;
    }
  }
}

// Resources Service
export class ResourcesService {
  async getAll() {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('resources')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('resources')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }
}

// Currencies Service
export class CurrenciesService {
  async getAll() {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching currencies:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: Omit<MasterData, 'id'>) {
    const { data, error } = await supabase
      .from('currencies')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating currency:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: Partial<MasterData>) {
    const { data, error } = await supabase
      .from('currencies')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('currencies')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting currency:', error);
      throw error;
    }
  }
}

// Service instances
export const customersService = new CustomersService();
export const companiesService = new CompaniesService();
export const divisionsService = new DivisionsService();
export const projectsService = new ProjectsService();
export const projectTypesService = new ProjectTypesService();
export const resourcesService = new ResourcesService();
export const currenciesService = new CurrenciesService();

// Utility function to get master data by type
export const getMasterDatas = async (type: string): Promise<MasterData[]> => {
  switch (type) {
    case 'customers':
      return customersService.getAll();
    case 'companies':
      return companiesService.getAll();
    case 'divisions':
      return divisionsService.getAll();
    case 'projects':
      return projectsService.getAll();
    case 'project_types':
      return projectTypesService.getAll();
    case 'resources':
      return resourcesService.getAll();
    case 'currencies':
      return currenciesService.getAll();
    default:
      throw new Error(`Unknown master data type: ${type}`);
  }
};
