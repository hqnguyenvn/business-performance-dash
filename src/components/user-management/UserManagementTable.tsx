
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserRow = {
  id: string;
  email: string;
  role: AppRole;
  is_active: boolean;
};

const roleOptions: AppRole[] = ["Admin", "Manager", "User"];

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserRow>>({});

  // Lấy danh sách user từ Supabase
  const fetchUsers = async () => {
    setLoading(true);
    // Get all user_roles
    const { data: userRoles, error } = await supabase
      .from("user_roles")
      .select("id,user_id,role,is_active");
    if (error) {
      toast({ title: "Error", description: error.message });
      setLoading(false);
      return;
    }
    // Lấy tài khoản auth
    const usersResp = await supabase.auth.admin.listUsers(); // For all users (admin access)
    if (usersResp.error) {
      toast({ title: "Error", description: usersResp.error.message });
      setUsers([]);
      setLoading(false);
      return;
    }
    // Kết hợp user_roles & email
    const userMap: Record<string, string> = {};
    usersResp.data.users.forEach((u) => {
      userMap[u.id] = u.email ?? "";
    });
    // Build table data
    const uRows = userRoles?.map((r: any) => ({
      id: r.id,
      email: userMap[r.user_id] || "",
      role: r.role as AppRole,
      is_active: r.is_active ?? true,
      user_id: r.user_id,
    }));
    setUsers(uRows || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  // Edit handler
  const handleEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Save handler (Update role & trạng thái)
  const handleSave = async () => {
    if (!editingId || !editForm) return;
    const { role, is_active } = editForm;
    const { error } = await supabase
      .from("user_roles")
      .update({ role, is_active })
      .eq("id", editingId);
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    toast({ title: "Success", description: "User updated." });
    setEditingId(null);
    setEditForm({});
    fetchUsers();
  };

  // Delete handler
  const handleDelete = async (user: UserRow) => {
    if (!window.confirm(`Delete user ${user.email}?`)) return;
    // Xóa khỏi user_roles (không xóa trong auth.users để tránh mất dữ liệu auth)
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    toast({ title: "Success", description: "User deleted." });
    fetchUsers();
  };

  // Create new user handler (sign up)
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("User");
  const handleAdd = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "Error", description: "Email and password required." });
      return;
    }
    // Tạo user mới qua Supabase Auth Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true,
    });
    if (error || !data?.user?.id) {
      toast({ title: "Error", description: error?.message || "Failed to create user." });
      return;
    }
    // Gán role và active (bảng user_roles trigger đã tự tạo row role User)
    const { error: roleErr } = await supabase
      .from("user_roles")
      .update({ role: newRole, is_active: true })
      .eq("user_id", data.user.id);
    if (roleErr) {
      toast({ title: "Error", description: roleErr.message });
    } else {
      toast({ title: "Success", description: "User created." });
      setNewEmail("");
      setNewPassword("");
      setNewRole("User");
      fetchUsers();
    }
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-lg font-semibold mb-4">User List</h2>
      <div className="mb-6 flex flex-wrap gap-2">
        <Input
          type="email"
          placeholder="New user email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-64"
        />
        <Input
          type="password"
          placeholder="New user password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-48"
        />
        <Select
          value={newRole}
          onValueChange={(v) => setNewRole(v as AppRole)}
        >
          {roleOptions.map((role) => (
            <option value={role} key={role}>{role}</option>
          ))}
        </Select>
        <Button onClick={handleAdd}>Add User</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border">
                    {editingId === user.id ? (
                      <Select
                        value={editForm.role || user.role}
                        onValueChange={(v) => setEditForm((ef) => ({ ...ef, role: v as AppRole }))}
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="p-2 border">
                    {editingId === user.id ? (
                      <Select
                        value={editForm.is_active !== undefined ? String(editForm.is_active) : String(user.is_active)}
                        onValueChange={(v) => setEditForm((ef) => ({ ...ef, is_active: v === "true" }))}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </Select>
                    ) : (
                      user.is_active ? "Active" : "Inactive"
                    )}
                  </td>
                  <td className="p-2 border">
                    {editingId === user.id ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={handleSave} className="mr-1">Save</Button>
                        <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="mr-1">
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(user)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
