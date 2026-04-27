import { Router } from "express";
import { db } from "../db";
import { eq, asc, type SQL } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import type { ZodType } from "zod";
import {
  toSnake,
  toSnakeArray,
  toCamel,
  coerceNumeric,
  coerceNumericArray,
} from "./serialize";
import {
  requireAuth,
  requirePermission,
  type AuthedRequest,
} from "../auth/middleware";
import { validateBody } from "./validate";
import { logDataEvent } from "./audit";

export interface CrudOptions {
  /** Drizzle table (e.g. companies) */
  table: PgTable;
  /** id column — dùng cho where clause */
  idColumn: PgColumn;
  /** Column to order by on GET / */
  orderBy?: PgColumn | SQL<unknown>;
  /** Permission required to read (mount-level). */
  readPermission: string;
  /** Permission required to write (create/update/delete). */
  writePermission: string;
  /**
   * Zod schema for the CREATE/UPDATE body. MUST be `.strict()` or use `.pick()`
   * to prevent mass-assignment of columns not in the schema.
   */
  bodySchema: ZodType<Record<string, unknown>>;
  /**
   * Hook to transform the parsed body (camelCase) before insert/update.
   * Use for numeric-to-string coercion on Drizzle `numeric` columns.
   */
  mapBody?: (body: Record<string, unknown>) => Record<string, unknown>;
  /**
   * Snake-case response fields to coerce string → number (Drizzle numeric).
   */
  numericFields?: readonly string[];
  /**
   * Resource name used for audit log. Defaults to the table name.
   */
  resource: string;
}

export function crudRouter(opts: CrudOptions): Router {
  const router = Router();
  const {
    table,
    idColumn,
    orderBy,
    readPermission,
    writePermission,
    bodySchema,
    mapBody = (b) => b,
    numericFields = [],
    resource,
  } = opts;

  const encode = (row: Record<string, unknown>) =>
    numericFields.length > 0
      ? coerceNumeric(toSnake(row), numericFields)
      : toSnake(row);
  const encodeArray = (rows: Record<string, unknown>[]) =>
    numericFields.length > 0
      ? coerceNumericArray(toSnakeArray(rows), numericFields)
      : toSnakeArray(rows);

  router.use(requireAuth);
  router.use(requirePermission(readPermission));

  router.get("/", async (_req, res) => {
    const query = db.select().from(table);
    const rows = orderBy
      ? await (query as any).orderBy(asc(orderBy as PgColumn))
      : await query;
    res.json(encodeArray(rows as Record<string, unknown>[]));
  });

  router.post(
    "/",
    requirePermission(writePermission),
    validateBody(bodySchema),
    async (req: AuthedRequest, res) => {
      const body = mapBody(toCamel(req.valid!.body as Record<string, unknown>));
      const [row] = await db
        .insert(table)
        .values(body as any)
        .returning();
      logDataEvent({
        req,
        resource,
        resourceId: (row as any)?.id ? String((row as any).id) : null,
        action: "create",
      }).catch(() => {});
      res.json(encode(row as Record<string, unknown>));
    },
  );

  router.put(
    "/:id",
    requirePermission(writePermission),
    validateBody((bodySchema as any).partial()),
    async (req: AuthedRequest, res) => {
      const body = mapBody(toCamel(req.valid!.body as Record<string, unknown>));
      const patch = { ...body, updatedAt: new Date() };
      const [row] = await db
        .update(table)
        .set(patch as any)
        .where(eq(idColumn, req.params.id))
        .returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      logDataEvent({
        req,
        resource,
        resourceId: req.params.id,
        action: "update",
      }).catch(() => {});
      res.json(encode(row as Record<string, unknown>));
    },
  );

  router.delete(
    "/:id",
    requirePermission(writePermission),
    async (req: AuthedRequest, res) => {
      const deleted = await db
        .delete(table)
        .where(eq(idColumn, req.params.id))
        .returning({ id: idColumn });
      if (deleted.length === 0)
        return res.status(404).json({ error: "Not found" });
      logDataEvent({
        req,
        resource,
        resourceId: req.params.id,
        action: "delete",
      }).catch(() => {});
      res.status(204).send();
    },
  );

  return router;
}
