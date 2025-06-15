
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserAddFormProps {
  onUserAdded: () => void;
  roleOptions: AppRole[];
}

export function UserAddForm({ onUserAdded, roleOptions }: UserAddFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("User");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "Error", description: "Email and password required." });
      return;
    }
    setAdding(true);
    const { data, error } = await supabase.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true,
    });
    if (error || !data?.user?.id) {
      toast({ title: "Error", description: error?.message || "Failed to create user." });
      setAdding(false);
      return;
    }
    const { error: roleErr } = await supabase
      .from("user_roles")
      .update({ role: newRole, is_active: true })
      .eq("user_id", data.user.id);
    setAdding(false);
    if (roleErr) {
      toast({ title: "Error", description: roleErr.message });
    } else {
      toast({ title: "Success", description: "User created." });
      setNewEmail("");
      setNewPassword("");
      setNewRole("User");
      onUserAdded();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Input
        type="email"
        placeholder="New user email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        className="w-64"
        disabled={adding}
      />
      <Input
        type="password"
        placeholder="New user password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-48"
        disabled={adding}
      />
      <Select
        value={newRole}
        onValueChange={(v) => setNewRole(v as AppRole)}
        disabled={adding}
      >
        {roleOptions.map((role) => (
          <option value={role} key={role}>{role}</option>
        ))}
      </Select>
      <Button onClick={handleAdd} disabled={adding}>Add User</Button>
    </div>
  );
}
