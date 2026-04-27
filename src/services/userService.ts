import { api } from "@/lib/api";

export type AppRole = "Admin" | "Manager" | "User";

export interface UserRow {
  /** user_roles row id (primary key for edit/delete) */
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: AppRole;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  locked_until: string | null;
  created_at: string | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name?: string;
  role: AppRole;
}

export interface UpdateUserInput {
  role?: AppRole;
  is_active?: boolean;
  full_name?: string;
  email?: string;
}

export interface UserSessionRow {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
}

export const userService = {
  async list(): Promise<UserRow[]> {
    return api.get<UserRow[]>("/users");
  },
  async create(input: CreateUserInput): Promise<UserRow> {
    return api.post<UserRow>("/users", input);
  },
  async update(id: string, input: UpdateUserInput): Promise<{ ok: boolean }> {
    return api.put<{ ok: boolean }>(`/users/${id}`, input);
  },
  async delete(id: string): Promise<void> {
    await api.delete<void>(`/users/${id}`);
  },
  async resetPassword(id: string, newPassword: string): Promise<{ ok: boolean }> {
    return api.post<{ ok: boolean }>(`/users/${id}/reset-password`, {
      password: newPassword,
    });
  },
  async unlock(id: string): Promise<{ ok: boolean }> {
    return api.post<{ ok: boolean }>(`/users/${id}/unlock`);
  },
  async listSessions(id: string): Promise<UserSessionRow[]> {
    return api.get<UserSessionRow[]>(`/users/${id}/sessions`);
  },
  async revokeAllSessions(id: string): Promise<{ ok: boolean; revoked: number }> {
    return api.delete<{ ok: boolean; revoked: number }>(`/users/${id}/sessions`);
  },
  async revokeSession(id: string, sessionId: string): Promise<void> {
    await api.delete<void>(`/users/${id}/sessions/${sessionId}`);
  },
};
