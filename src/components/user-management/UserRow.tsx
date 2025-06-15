
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";

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
}

export function UserRow({ user, roleOptions, onChange }: UserRowProps) {
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

    // Cập nhật profiles (cột full_name)
    let profileError;
    if (full_name !== undefined) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name })
        .eq("id", user.user_id);
      profileError = error;
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
    onChange();
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
    <tr key={user.id}>
      <td className="p-2 border">{user.email}</td>
      <td className="p-2 border">
        {editing ? (
          <Input
            value={editForm.full_name ?? ""}
            onChange={handleFullNameChange}
            className="w-40"
            disabled={saving}
            placeholder="Enter full name"
          />
        ) : (
          user.full_name || ""
        )}
      </td>
      <td className="p-2 border">
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
      <td className="p-2 border">
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
            <SelectTrigger className="w-24">
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
      <td className="p-2 border">
        {editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="mr-1">
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={handleEdit} className="mr-1">
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
