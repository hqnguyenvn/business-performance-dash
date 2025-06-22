
import { supabase } from "@/integrations/supabase/client";
import { Role, CreateRoleData, UpdateRoleData } from "@/types/role";

export class RoleService {
  async getAll(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('code');
    
    if (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
    
    return data || [];
  }

  async create(item: CreateRoleData): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating role:', error);
      throw error;
    }
    
    return data;
  }

  async update(id: string, item: UpdateRoleData): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating role:', error);
      throw error;
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
}

export const roleService = new RoleService();
