import { api } from "@/lib/api";
import { Role, CreateRoleData, UpdateRoleData } from "@/types/role";

export class RoleService {
  async getAll(): Promise<Role[]> {
    return api.get<Role[]>("/roles");
  }

  async create(item: CreateRoleData): Promise<Role> {
    return api.post<Role>("/roles", item);
  }

  async update(id: string, item: UpdateRoleData): Promise<Role> {
    return api.put<Role>(`/roles/${id}`, item);
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/roles/${id}`);
  }
}

export const roleService = new RoleService();
