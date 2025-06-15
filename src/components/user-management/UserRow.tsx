
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export type UserRowType = {
  id: string;
  email: string;
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

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    const { role, is_active } = editForm;
    const { error } = await supabase
      .from("user_roles")
      .update({ role, is_active })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message });
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
        {editing ? (
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
        {editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving} className="mr-1">Save</Button>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>Cancel</Button>
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
