
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

    // Đăng ký tài khoản Supabase thông qua auth.signUp (client only)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        emailRedirectTo: window.location.origin + "/auth"
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

    // Nếu đăng ký thành công, sẽ có signUpData.user. Sau khi xác thực email, user mới tạo sẽ có trong bảng user_roles (do trigger trên DB).
    // Cập nhật vai trò cho user mới tạo, nếu có session thì cập nhật luôn
    let userId: string | undefined = signUpData?.user?.id;

    // Có thể userId chưa xuất hiện do Supabase yêu cầu xác thực email trước,
    // nên ta thử lấy userRoles row với email vừa nhập, cập nhật role luôn nếu tìm thấy
    if (!userId) {
      // Chờ một lát rồi thử lấy userId từ bảng user_roles
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Query bảng user_roles để tìm user_id theo email
      const { data: usersList } = await supabase
        .from("user_roles")
        .select("user_id")
        .limit(10); // Tối ưu, ko lấy hết
      if (usersList && Array.isArray(usersList)) {
        // Thực chất không query được map email <-> user_id ở client, trừ khi cho phép public đọc bảng auth.users (không làm được)
        // Nên chỉ có thể update role nếu userId có sẵn
      }
      // Không tự gán được role nếu userId chưa có.
    } else {
      // update role vào user_roles nếu user đã có trong bảng
      // Bảng user_roles sẽ tự động tạo row với role mặc định là "User". Nếu muốn đổi role thì update luôn.
      const { error: roleErr } = await supabase
        .from("user_roles")
        .update({ role: newRole, is_active: true })
        .eq("user_id", userId);
      if (roleErr) {
        toast({ title: "Warning", description: "User created, but failed to update role: " + roleErr.message });
        setAdding(false);
        setNewEmail("");
        setNewPassword("");
        setNewRole("User");
        onUserAdded();
        return;
      }
    }

    toast({ title: "Success", description: "User created. Please ask user to check email to verify account!" });
    setNewEmail("");
    setNewPassword("");
    setNewRole("User");
    setAdding(false);
    onUserAdded();
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
