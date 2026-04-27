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
import { Label } from "@/components/ui/label";
import {
  PasswordInput,
  PasswordStrengthBar,
} from "@/components/ui/password-input";
import { toast } from "@/hooks/use-toast";
import { userService, type UserRow } from "@/services/userService";

interface Props {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
  onDone: () => void;
}

export function ResetPasswordDialog({ open, user, onClose, onDone }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirm("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await userService.resetPassword(user.id, password);
      toast({
        title: "Success",
        description: `Password reset for ${user.email}. All their sessions have been revoked.`,
      });
      onDone();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {user ? (
              <>
                Set a new password for <strong>{user.email}</strong>. The user
                will be forced to change it again on their next login, and all
                of their active sessions will be revoked.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <PasswordInput
              id="new"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={submitting}
            />
            <PasswordStrengthBar password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm</Label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Resetting..." : "Reset password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
