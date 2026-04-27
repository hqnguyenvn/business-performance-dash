import { api } from "@/lib/api";
import { Employee } from "@/types/employee";

export class EmployeeService {
  async getAll(): Promise<Employee[]> {
    return api.get<Employee[]>("/employees");
  }

  async create(
    item: Omit<Employee, "id" | "created_at" | "updated_at">,
  ): Promise<Employee> {
    return api.post<Employee>("/employees", item);
  }

  async update(id: string, item: Partial<Employee>): Promise<Employee> {
    return api.put<Employee>(`/employees/${id}`, item);
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/employees/${id}`);
  }

  async bulkDelete(year: number, months: number[]): Promise<{ deleted: number }> {
    return api.post<{ deleted: number }>("/employees/bulk-delete", { year, months });
  }

  async bulkUpsert(
    rows: Array<Partial<Employee> & Omit<Employee, "id" | "created_at" | "updated_at">>,
  ): Promise<{
    created: number;
    updated: number;
    errors: { index: number; error: string }[];
  }> {
    return api.post("/employees/bulk-upsert", rows);
  }
}

export const employeeService = new EmployeeService();
