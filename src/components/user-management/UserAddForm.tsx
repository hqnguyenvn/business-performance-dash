import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { createUserWithAdmin } from "@/utils/supabaseAdmin";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserAddFormProps {
  onUserAdded: () => void;
  roleOptions: AppRole[];
}

export function UserAddForm({ onUserAdded, roleOptions }: UserAddFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("User");
  const [adding, setAdding] = useState(false);

  const handleRoleCheckbox = (role: AppRole) => {
    setNewRole(role);
  };

  const handleAdd = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "Error", description: "Email and password required." });
      return;
    }
    setAdding(true);

    try {
      // Gọi API server-side để tạo user
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role: newRole,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully",
      });

      // Reset form
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("User");

      // Refresh user list
      onUserAdded();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
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
      <Input
        type="text"
        placeholder="Full name"
        value={newFullName}
        onChange={(e) => setNewFullName(e.target.value)}
        className="w-56"
        disabled={adding}
      />
      <div className="flex gap-3 items-center">
        {roleOptions.map((role) => (
          <label className="inline-flex items-center gap-1 cursor-pointer" key={role}>
            <Checkbox
              checked={newRole === role}
              disabled={adding}
              onCheckedChange={() => handleRoleCheckbox(role)}
            />
            <span>{role}</span>
          </label>
        ))}
      </div>
      <Button onClick={handleAdd} disabled={adding}>Add User</Button>
    </div>
  );
}