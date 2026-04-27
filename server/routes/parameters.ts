import { Router } from "express";
import { db } from "../db";
import { parameter } from "../schema";
import { eq, desc } from "drizzle-orm";
import { toSnake, toSnakeArray } from "../lib/serialize";
import {
  requireAuth,
  requirePermission,
  type AuthedRequest,
} from "../auth/middleware";
import { PERM } from "../auth/permissions";
import { validateBody, validateParams, paramsWithId } from "../lib/validate";
import { parameterBodySchema } from "../lib/schemas";
import { logDataEvent } from "../lib/audit";

export const parametersRouter = Router();

parametersRouter.use(requireAuth);
parametersRouter.use(requirePermission(PERM.PARAMETERS_READ));

parametersRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(parameter).orderBy(desc(parameter.year));
  res.json(toSnakeArray(rows));
});

parametersRouter.post(
  "/",
  requirePermission(PERM.PARAMETERS_WRITE),
  validateBody(parameterBodySchema),
  async (req: AuthedRequest, res) => {
    const body = req.valid!.body as {
      year: number;
      code: string;
      value: string;
      descriptions?: string | null;
    };
    const [row] = await db
      .insert(parameter)
      .values({
        year: body.year,
        code: body.code,
        value: body.value,
        descriptions: body.descriptions ?? null,
      })
      .returning();
    logDataEvent({
      req,
      resource: "parameter",
      resourceId: row.id,
      action: "create",
    }).catch(() => {});
    res.json(toSnake(row));
  },
);

parametersRouter.put(
  "/:id",
  requirePermission(PERM.PARAMETERS_WRITE),
  validateParams(paramsWithId),
  validateBody(parameterBodySchema),
  async (req: AuthedRequest, res) => {
    const body = req.valid!.body as {
      year: number;
      code: string;
      value: string;
      descriptions?: string | null;
    };
    const [row] = await db
      .update(parameter)
      .set({
        year: body.year,
        code: body.code,
        value: body.value,
        descriptions: body.descriptions ?? null,
        updatedAt: new Date(),
      })
      .where(eq(parameter.id, req.params.id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "parameter",
      resourceId: req.params.id,
      action: "update",
    }).catch(() => {});
    res.json(toSnake(row));
  },
);

parametersRouter.delete(
  "/:id",
  requirePermission(PERM.PARAMETERS_WRITE),
  validateParams(paramsWithId),
  async (req: AuthedRequest, res) => {
    const deleted = await db
      .delete(parameter)
      .where(eq(parameter.id, req.params.id))
      .returning({ id: parameter.id });
    if (deleted.length === 0)
      return res.status(404).json({ error: "Not found" });
    logDataEvent({
      req,
      resource: "parameter",
      resourceId: req.params.id,
      action: "delete",
    }).catch(() => {});
    res.status(204).send();
  },
);
