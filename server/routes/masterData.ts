import { Router } from "express";
import {
  companies,
  divisions,
  customers,
  projects,
  projectTypes,
  resources,
  costTypes,
  currencies,
} from "../schema";
import { crudRouter } from "../lib/crudRouter";
import { PERM } from "../auth/permissions";
import {
  masterDataBodySchema,
  divisionBodySchema,
  projectBodySchema,
} from "../lib/schemas";
import { db } from "../db";
import { requirePermission, type AuthedRequest } from "../auth/middleware";
import { logDataEvent } from "../lib/audit";

/**
 * 8 master data routers gộp vào một Router cha.
 * app.use("/api", masterDataRouter) expose:
 *   /api/companies, /api/divisions, /api/customers, /api/projects,
 *   /api/project-types, /api/resources, /api/cost-types, /api/currencies
 */
export const masterDataRouter = Router();

masterDataRouter.use(
  "/companies",
  crudRouter({
    table: companies,
    idColumn: companies.id,
    orderBy: companies.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: masterDataBodySchema,
    resource: "companies",
  }),
);

masterDataRouter.use(
  "/divisions",
  crudRouter({
    table: divisions,
    idColumn: divisions.id,
    orderBy: divisions.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: divisionBodySchema,
    resource: "divisions",
  }),
);

masterDataRouter.use(
  "/customers",
  crudRouter({
    table: customers,
    idColumn: customers.id,
    orderBy: customers.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: masterDataBodySchema,
    resource: "customers",
  }),
);

// Projects need an extra "delete all" endpoint for the bulk-reset workflow
// (user clears master entirely then re-imports a clean Excel template).
const projectsRouter = crudRouter({
  table: projects,
  idColumn: projects.id,
  orderBy: projects.code,
  readPermission: PERM.MASTER_DATA_READ,
  writePermission: PERM.MASTER_DATA_WRITE,
  bodySchema: projectBodySchema,
  resource: "projects",
});

// POST (not DELETE /all) so this never collides with crudRouter's DELETE /:id.
projectsRouter.post(
  "/delete-all",
  requirePermission(PERM.MASTER_DATA_WRITE),
  async (req: AuthedRequest, res) => {
    try {
      const deleted = await db
        .delete(projects)
        .returning({ id: projects.id });
      logDataEvent({
        req,
        resource: "projects",
        resourceId: null,
        action: "delete",
        metadata: { source: "delete_all", count: deleted.length },
      }).catch(() => {});
      res.json({ deleted: deleted.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      // Most likely cause: foreign-key constraint (revenue / plan still references)
      res.status(409).json({
        error:
          "Không xoá được toàn bộ Project — có dữ liệu khác (revenue / plan) đang tham chiếu. Hãy xoá dữ liệu phụ thuộc trước.",
        detail: msg,
      });
    }
  },
);

masterDataRouter.use("/projects", projectsRouter);

masterDataRouter.use(
  "/project-types",
  crudRouter({
    table: projectTypes,
    idColumn: projectTypes.id,
    orderBy: projectTypes.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: masterDataBodySchema,
    resource: "project_types",
  }),
);

masterDataRouter.use(
  "/resources",
  crudRouter({
    table: resources,
    idColumn: resources.id,
    orderBy: resources.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: masterDataBodySchema,
    resource: "resources",
  }),
);

masterDataRouter.use(
  "/cost-types",
  crudRouter({
    table: costTypes,
    idColumn: costTypes.id,
    orderBy: costTypes.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: masterDataBodySchema,
    resource: "cost_types",
  }),
);

masterDataRouter.use(
  "/currencies",
  crudRouter({
    table: currencies,
    idColumn: currencies.id,
    orderBy: currencies.code,
    readPermission: PERM.MASTER_DATA_READ,
    writePermission: PERM.MASTER_DATA_WRITE,
    bodySchema: masterDataBodySchema,
    resource: "currencies",
  }),
);
