import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput, PasswordStrengthBar } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  userService,
  type AppRole,
  type UserRow,
} from "@/services/userService";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  user?: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES: AppRole[] = ["Admin", "Manager", "User"];

export function UserFormDialog({ open, mode, user, onClose, onSaved }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("User");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && user) {
      setEmail(user.email);
      setPassword("");
      setFullName(user.full_name ?? "");
      setRole(user.role);
      setIsActive(user.is_active);
    } else {
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("User");
      setIsActive(true);
    }
  }, [open, mode, user]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      return;
    }
    if (mode === "create" && password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        await userService.create({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
          role,
        });
        toast({
          title: "Success",
          description: `User created. They will be asked to change their password on first login.`,
        });
      } else if (user) {
        await userService.update(user.id, {
          email: email.trim() !== user.email ? email.trim() : undefined,
          full_name: fullName,
          role,
          is_active: isActive,
        });
        toast({ title: "Success", description: "User updated." });
      }
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "New users will be forced to change their password on first login."
              : "Update user details. Use the reset password action to change the password."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={submitting}
            />
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={submitting}
              />
              <PasswordStrengthBar password={password} />
              <p className="text-xs text-gray-500">
                The user will be required to change this on first login.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Optional"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AppRole)}
              disabled={submitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "edit" && (
            <div className="flex items-center justify-between">
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={submitting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
