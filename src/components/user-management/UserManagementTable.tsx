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
type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

const roleOptions: AppRole[] = ["Admin", "Manager", "User"];

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRowType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user list from Supabase
  const fetchUsers = async () => {
    setLoading(true);

    // 1. Fetch all user_roles
    const { data: userRolesDataRaw, error: userRolesError } = await supabase
      .from("user_roles")
      .select("id,user_id,role,is_active");

    if (userRolesError) {
      toast({ title: "Error", description: userRolesError.message });
      setLoading(false);
      return;
    }

    // 2. Fetch all profiles
    const { data: profilesDataRaw, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url");

    if (profilesError) {
      toast({ title: "Error", description: profilesError.message });
      setLoading(false);
      return;
    }

    // 3. Build a map from user id to profile
    const profilesMap = new Map<string, Profile>();
    (profilesDataRaw ?? []).forEach((p) => {
      profilesMap.set(p.id, {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      });
    });

    // 4. Merge info
    const rolesArr: UserRolesRow[] = Array.isArray(userRolesDataRaw)
      ? (userRolesDataRaw as UserRolesRow[])
      : [];
    const uRows: UserRowType[] = rolesArr.map((r) => {
      const profile = profilesMap.get(r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        email: profile?.email || "",
        full_name: profile?.full_name || "",
        role: r.role,
        is_active: r.is_active ?? true,
      };
    });
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
              <th className="p-2 border">Full name</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  roleOptions={roleOptions}
                  onChange={fetchUsers}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
