
export interface Role {
  id: string;
  code: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateRoleData = Omit<Role, 'id' | 'created_at' | 'updated_at'>;
export type UpdateRoleData = Partial<CreateRoleData>;
