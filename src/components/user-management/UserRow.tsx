import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Edit, X, Trash2 } from "lucide-react";

type AppRole = Database["public"]["Enums"]["app_role"];

export type UserRowType = {
  id: string;
  email: string;
  full_name?: string;
  role: AppRole;
  is_active: boolean;
  user_id: string;
};

interface UserRowProps {
  user: UserRowType;
  roleOptions: AppRole[];
  onChange: () => void;
  index?: number;
}

export function UserRow({ user, roleOptions, onChange, index }: UserRowProps) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserRowType>>({});
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditing(true);
    setEditForm({ ...user });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({});
  };

  const handleRoleCheckbox = (role: AppRole) => {
    setEditForm((ef) => ({ ...ef, role }));
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((ef) => ({ ...ef, full_name: e.target.value }));
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    const { role, is_active, full_name } = editForm;

    // Cập nhật user_roles
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role, is_active })
      .eq("id", user.id);

    let profileError;
    // Nếu có cập nhật tên
    if (full_name !== undefined) {
      // Thử update profile (use .select to get affected rows!)
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name })
        .eq("id", user.user_id)
        .select('id');

      if (!error && (!data || data.length === 0)) {
        // Không có profile -> tạo mới
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([{ id: user.user_id, full_name }]);
        profileError = insertError;
      } else {
        profileError = error;
      }
    }

    setSaving(false);

    if (roleError || profileError) {
      toast({
        title: "Error",
        description: (roleError?.message || '') + (profileError ? " / " + profileError.message : ''),
      });
      return;
    }

    toast({ title: "Success", description: "User updated." });
    setEditing(false);
    setEditForm({});
    setTimeout(() => {
      onChange();
    }, 300);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete user ${user.email}?`)) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message });
      return;
    }
    toast({ title: "Success", description: "User deleted." });
    onChange();
  };

  return (
    <tr key={user.id} className="hover:bg-gray-50">
      <td className="border border-gray-300 text-center p-1">{index !== undefined ? index + 1 : ""}</td>
      <td className="border border-gray-300 p-1">{user.email}</td>
      <td className="border border-gray-300 p-1">
        {editing ? (
          <Input
            value={editForm.full_name ?? ""}
            onChange={handleFullNameChange}
            className="border-0 p-1 h-8"
            disabled={saving}
            placeholder="Enter full name"
          />
        ) : (
          user.full_name || ""
        )}
      </td>
      <td className="border border-gray-300 p-1">
        {editing ? (
          <div className="flex gap-2">
            {roleOptions.map((role) => (
              <label className="inline-flex items-center gap-1 cursor-pointer" key={role}>
                <Checkbox
                  checked={editForm.role === role}
                  onCheckedChange={() => handleRoleCheckbox(role)}
                  disabled={saving}
                />
                <span>{role}</span>
              </label>
            ))}
          </div>
        ) : (
          user.role
        )}
      </td>
      <td className="border border-gray-300 p-1">
        {editing ? (
          <Select
            value={
              editForm.is_active !== undefined
                ? String(editForm.is_active)
                : String(user.is_active)
            }
            onValueChange={(v) =>
              setEditForm((ef) => ({ ...ef, is_active: v === "true" }))
            }
          >
            <SelectTrigger className="border-0 p-1 h-8">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : user.is_active ? (
          "Active"
        ) : (
          "Inactive"
        )}
      </td>
      <td className="border border-gray-300 p-1">
        {editing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="h-6 w-6 p-0">
              ✓
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={handleEdit} className="h-6 w-6 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleDelete} className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
