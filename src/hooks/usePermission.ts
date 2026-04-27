import { useAuth } from "@/contexts/AuthContext";

/**
 * Thin hook over AuthContext.can() for readable call sites:
 *
 *   const canWriteCosts = usePermission("costs:write");
 *   {canWriteCosts && <Button>Add</Button>}
 */
export function usePermission(permission: string | string[]): boolean {
  const { can } = useAuth();
  return can(permission);
}
