import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";

export class EmployeeService {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('username');

    if (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }

    return (data || []) as Employee[];
  }

  async create(item: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      throw error;
    }

    return data as Employee;
  }

  async update(id: string, item: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      throw error;
    }

    return data as Employee;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }
}

export const employeeService = new EmployeeService();
