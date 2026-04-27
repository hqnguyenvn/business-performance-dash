import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Unlock,
  UserCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { userService, type UserRow } from "@/services/userService";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserFormDialog } from "./UserFormDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { RevokeSessionsDialog } from "./RevokeSessionsDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; user: UserRow }
  | { kind: "reset"; user: UserRow }
  | { kind: "sessions"; user: UserRow }
  | { kind: "delete"; user: UserRow };

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const reload = async () => {
    setLoading(true);
    try {
      const list = await userService.list();
      setUsers(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter((u) =>
      [u.email, u.full_name, u.role].some((v) => v?.toLowerCase().includes(s)),
    );
  }, [users, search]);

  const handleUnlock = async (user: UserRow) => {
    try {
      await userService.unlock(user.id);
      toast({ title: "Success", description: `${user.email} unlocked.` });
      reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlock";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setDialog({ kind: "create" })}>
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Full name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-20 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user, idx) => {
                const locked =
                  user.locked_until &&
                  new Date(user.locked_until) > new Date();
                return (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-gray-500">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge user={user} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.last_login_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDialog({ kind: "edit", user })}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDialog({ kind: "reset", user })}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDialog({ kind: "sessions", user })}
                          >
                            <UserCircle2 className="h-4 w-4 mr-2" />
                            Sessions
                          </DropdownMenuItem>
                          {locked && (
                            <DropdownMenuItem onClick={() => handleUnlock(user)}>
                              <Unlock className="h-4 w-4 mr-2" />
                              Unlock
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDialog({ kind: "delete", user })}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>


      {/* Dialogs */}
      <UserFormDialog
        open={dialog.kind === "create"}
        mode="create"
        onClose={() => setDialog({ kind: "none" })}
        onSaved={reload}
      />
      <UserFormDialog
        open={dialog.kind === "edit"}
        mode="edit"
        user={dialog.kind === "edit" ? dialog.user : null}
        onClose={() => setDialog({ kind: "none" })}
        onSaved={reload}
      />
      <ResetPasswordDialog
        open={dialog.kind === "reset"}
        user={dialog.kind === "reset" ? dialog.user : null}
        onClose={() => setDialog({ kind: "none" })}
        onDone={reload}
      />
      <RevokeSessionsDialog
        open={dialog.kind === "sessions"}
        user={dialog.kind === "sessions" ? dialog.user : null}
        onClose={() => setDialog({ kind: "none" })}
      />
      <DeleteUserDialog
        open={dialog.kind === "delete"}
        user={dialog.kind === "delete" ? dialog.user : null}
        onClose={() => setDialog({ kind: "none" })}
        onDeleted={reload}
      />
    </div>
  );
}
