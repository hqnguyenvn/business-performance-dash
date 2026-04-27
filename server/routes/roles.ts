import { roles } from "../schema";
import { crudRouter } from "../lib/crudRouter";
import { PERM } from "../auth/permissions";
import { z } from "zod";

/**
 * Employee role lookup (not app_role enum). Uses master_data permissions.
 */
const roleBodySchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    description: z.string().trim().max(5000).nullable().optional(),
  })
  .strict();

export const rolesRouter = crudRouter({
  table: roles,
  idColumn: roles.id,
  orderBy: roles.code,
  readPermission: PERM.MASTER_DATA_READ,
  writePermission: PERM.MASTER_DATA_WRITE,
  bodySchema: roleBodySchema,
  resource: "roles",
});
