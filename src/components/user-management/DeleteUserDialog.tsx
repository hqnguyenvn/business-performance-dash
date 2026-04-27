import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { userService, type UserRow } from "@/services/userService";

interface Props {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteUserDialog({ open, user, onClose, onDeleted }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await userService.delete(user.id);
      toast({
        title: "Success",
        description: `User ${user.email} has been deleted.`,
      });
      onDeleted();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this user?</AlertDialogTitle>
          <AlertDialogDescription>
            {user ? (
              <>
                This will permanently delete the account for{" "}
                <strong>{user.email}</strong>, including their profile, role,
                and all active sessions. This action cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
