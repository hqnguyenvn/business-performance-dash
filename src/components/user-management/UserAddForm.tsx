
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        emailRedirectTo: window.location.origin + "/auth",
        data: {
          email_confirm_at: new Date().toISOString() // Auto-confirm email at current time
        }
      }
    });

    if (signUpError) {
      toast({
        title: "Error",
        description:
          signUpError.message === "User already registered"
            ? "User already exists, please use a different email."
            : signUpError.message,
      });
      setAdding(false);
      return;
    }

    let userId: string | undefined = signUpData?.user?.id;

    if (!userId) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      // Thêm role cho user
      const { error: roleErr } = await supabase
        .from("user_roles")
        .update({ role: newRole, is_active: true })
        .eq("user_id", userId);
      if (roleErr) {
        toast({ title: "Warning", description: "User created, but failed to update role: " + roleErr.message });
        setAdding(false);
        setNewEmail("");
        setNewPassword("");
        setNewFullName("");
        setNewRole("User");
        onUserAdded();
        return;
      }
      
      // Cập nhật full_name vào profiles (nếu có nhập)
      if (newFullName.trim()) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ full_name: newFullName.trim() })
          .eq("id", userId);
        if (profileErr) {
          toast({ title: "Warning", description: "Failed to set full name: " + profileErr.message });
        }
      }
    }

    toast({ title: "Success", description: "User created and activated successfully!" });
    setNewEmail("");
    setNewPassword("");
    setNewFullName("");
    setNewRole("User");
    setAdding(false);
    onUserAdded();
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
