
import React, { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { UserAddForm } from "./UserAddForm";
import { UserRow, UserRowType } from "./UserRow";

type AppRole = Database["public"]["Enums"]["app_role"];
type UserRolesRow = {
  id: string;
  user_id: string;
  role: AppRole;
  is_active: boolean;
};

const roleOptions: AppRole[] = ["Admin", "Manager", "User"];

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRowType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user list from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    const { data: userRolesDataRaw, error } = await supabase
      .from("user_roles")
      .select("id,user_id,role,is_active");
    if (error) {
      toast({ title: "Error", description: error.message });
      setLoading(false);
      return;
    }

    const usersResp = await supabase.auth.admin.listUsers();
    if (usersResp.error) {
      toast({ title: "Error", description: usersResp.error.message });
      setUsers([]);
      setLoading(false);
      return;
    }
    const userMap: Record<string, string> = {};
    usersResp.data.users.forEach((u: any) => {
      userMap[u.id] = u.email ?? "";
    });

    const rolesArr: UserRolesRow[] = Array.isArray(userRolesDataRaw) ? userRolesDataRaw as UserRolesRow[] : [];
    const uRows: UserRowType[] = rolesArr.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      email: userMap[r.user_id] || "",
      role: r.role,
      is_active: r.is_active ?? true,
    }));
    setUsers(uRows);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-lg font-semibold mb-4">User List</h2>
      <UserAddForm onUserAdded={fetchUsers} roleOptions={roleOptions} />
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
                <UserRow key={user.id} user={user} roleOptions={roleOptions} onChange={fetchUsers} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
