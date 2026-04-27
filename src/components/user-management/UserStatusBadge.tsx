import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, KeyRound, Lock } from "lucide-react";
import type { UserRow } from "@/services/userService";

interface Props {
  user: UserRow;
}

/**
 * Composite badge showing a user's current auth state:
 * - Inactive (role disabled)
 * - Locked (too many failed attempts)
 * - Must change password (first-login flag)
 * - Active (default, happy path)
 */
export function UserStatusBadge({ user }: Props) {
  if (!user.is_active) {
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  }

  const locked =
    user.locked_until && new Date(user.locked_until) > new Date();
  if (locked) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Lock className="h-3 w-3" />
        Locked
      </Badge>
    );
  }

  if (user.must_change_password) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500 text-amber-700">
        <KeyRound className="h-3 w-3" />
        Must change password
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
      <CheckCircle2 className="h-3 w-3" />
      Active
    </Badge>
  );
}
