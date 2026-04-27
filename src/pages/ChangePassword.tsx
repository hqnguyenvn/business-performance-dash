import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PasswordInput,
  PasswordStrengthBar,
} from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Lock, LogOut } from "lucide-react";

export default function ChangePassword() {
  const { user, mustChangePassword, refresh, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (newPassword.length < 10) {
      toast({
        title: "Error",
        description:
          "New password must be at least 10 characters and contain a mix of letters and digits.",
        variant: "destructive",
      });
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast({
        title: "Error",
        description: "Password must contain both letters and digits.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword === currentPassword) {
      toast({
        title: "Error",
        description: "New password must differ from current password.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      await refresh();
      toast({
        title: "Success",
        description: "Password changed successfully.",
      });
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to change password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>
              {mustChangePassword ? "Change Password Required" : "Change Password"}
            </CardTitle>
          </div>
          <CardDescription>
            {mustChangePassword
              ? `Welcome${user?.email ? `, ${user.email}` : ""}. You must set a new password before continuing.`
              : "Update your password to keep your account secure."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <PasswordInput
                id="current"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <PasswordInput
                id="new"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
              <PasswordStrengthBar password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Changing..." : "Change Password"}
            </Button>
            {mustChangePassword && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out instead
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
