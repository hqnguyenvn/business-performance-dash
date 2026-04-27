import { Router } from "express";
import { bonusByC, bonusByD } from "../schema";
import { crudRouter } from "../lib/crudRouter";
import { PERM } from "../auth/permissions";
import { bonusByCBodySchema, bonusByDBodySchema } from "../lib/schemas";

export const bonusRouter = Router();

bonusRouter.use(
  "/bonus-by-c",
  crudRouter({
    table: bonusByC,
    idColumn: bonusByC.id,
    orderBy: bonusByC.year,
    readPermission: PERM.BONUS_READ,
    writePermission: PERM.BONUS_WRITE,
    bodySchema: bonusByCBodySchema,
    resource: "bonus_by_c",
    numericFields: ["bn_bmm"],
    mapBody: (b) => {
      const out: Record<string, unknown> = { ...b };
      if (out.year !== undefined) out.year = Number(out.year);
      if (out.bnBmm !== undefined && out.bnBmm !== null) {
        out.bnBmm = String(out.bnBmm);
      }
      return out;
    },
  }),
);

bonusRouter.use(
  "/bonus-by-d",
  crudRouter({
    table: bonusByD,
    idColumn: bonusByD.id,
    orderBy: bonusByD.year,
    readPermission: PERM.BONUS_READ,
    writePermission: PERM.BONUS_WRITE,
    bodySchema: bonusByDBodySchema,
    resource: "bonus_by_d",
    numericFields: ["bn_bmm"],
    mapBody: (b) => {
      const out: Record<string, unknown> = { ...b };
      if (out.year !== undefined) out.year = Number(out.year);
      if (out.bnBmm !== undefined && out.bnBmm !== null) {
        out.bnBmm = String(out.bnBmm);
      }
      return out;
    },
  }),
);
