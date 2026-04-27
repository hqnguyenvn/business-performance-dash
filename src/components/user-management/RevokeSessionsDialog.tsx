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
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  userService,
  type UserRow,
  type UserSessionRow,
} from "@/services/userService";

interface Props {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function truncateUA(ua: string | null | undefined): string {
  if (!ua) return "-";
  if (ua.length <= 60) return ua;
  return ua.slice(0, 57) + "...";
}

export function RevokeSessionsDialog({ open, user, onClose }: Props) {
  const [sessions, setSessions] = useState<UserSessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await userService.listSessions(user.id);
      setSessions(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load sessions";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const handleRevokeOne = async (sessionId: string) => {
    if (!user) return;
    setBusyId(sessionId);
    try {
      await userService.revokeSession(user.id, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!user) return;
    setRevokingAll(true);
    try {
      const res = await userService.revokeAllSessions(user.id);
      toast({
        title: "Success",
        description: `Revoked ${res.revoked} session(s) for ${user.email}.`,
      });
      setSessions([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Active sessions</DialogTitle>
          <DialogDescription>
            {user ? (
              <>
                Active refresh-token sessions for <strong>{user.email}</strong>.
                Revoking a session will force the user to log in again on that
                device.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left">
                <th className="p-2 border-b">Device</th>
                <th className="p-2 border-b">IP</th>
                <th className="p-2 border-b">Last used</th>
                <th className="p-2 border-b">Created</th>
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No active sessions.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-2" title={s.user_agent ?? ""}>
                      {truncateUA(s.user_agent)}
                    </td>
                    <td className="p-2">{s.ip_address ?? "-"}</td>
                    <td className="p-2">{formatDate(s.last_used_at)}</td>
                    <td className="p-2">{formatDate(s.created_at)}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={busyId === s.id}
                        onClick={() => handleRevokeOne(s.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevokeAll}
            disabled={revokingAll || sessions.length === 0}
          >
            {revokingAll ? "Revoking..." : "Revoke all"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
