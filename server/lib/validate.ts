import type { Request, Response, NextFunction } from "express";
import { z, type ZodType, type ZodError } from "zod";

/**
 * Express middleware factory: parse req.body / req.query / req.params against
 * a zod schema. On failure returns 400 with a human-readable list of issues.
 * On success the parsed (and type-narrowed) data is placed onto `req.valid`.
 *
 * Usage:
 *   const BodySchema = z.object({ year: z.number().int() }).strict();
 *   router.post("/", validateBody(BodySchema), (req, res) => {
 *     req.valid.body.year // number
 *   });
 */

declare module "express-serve-static-core" {
  interface Request {
    valid?: {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
  }
}

function formatIssues(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

function makeValidator(
  kind: "body" | "query" | "params",
  schema: ZodType<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const source = kind === "body" ? req.body : kind === "query" ? req.query : req.params;
    const result = schema.safeParse(source ?? {});
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request",
        issues: formatIssues(result.error),
      });
    }
    req.valid = { ...(req.valid ?? {}), [kind]: result.data };
    next();
  };
}

export const validateBody = <T extends ZodType<unknown>>(schema: T) =>
  makeValidator("body", schema);
export const validateQuery = <T extends ZodType<unknown>>(schema: T) =>
  makeValidator("query", schema);
export const validateParams = <T extends ZodType<unknown>>(schema: T) =>
  makeValidator("params", schema);

// -----------------------------------------------------------------------------
// Reusable atomic schemas
// -----------------------------------------------------------------------------

export const uuidSchema = z.string().uuid("Must be a UUID");
export const optionalUuid = uuidSchema.optional().nullable();

export const yearSchema = z.coerce.number().int().min(2000).max(2100);
export const monthSchema = z.coerce.number().int().min(1).max(12);

export const shortStringSchema = z.string().trim().min(1).max(255);
export const longStringSchema = z.string().trim().max(5000);
export const optionalShortString = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional();
export const optionalLongString = z
  .string()
  .trim()
  .max(5000)
  .nullable()
  .optional();

export const nonNegativeNumber = z.coerce
  .number()
  .finite()
  .nonnegative("Must be >= 0");
export const numericField = z.coerce.number().finite();

/** Params with `:id` — use for `validateParams(paramsWithId)`. */
export const paramsWithId = z.object({ id: uuidSchema });

/** Generic pagination query spec. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z
    .union([z.coerce.number().int().min(1).max(5000), z.literal("all")])
    .default(25),
});

/** Filter query used by costs/revenues/salary-costs. */
export const baseListFilter = z.object({
  year: yearSchema.optional(),
  months: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
        : [],
    ),
  q: z.string().trim().max(100).optional(),
});

/**
 * Strong password schema: at least 10 chars, at least one letter and one digit.
 * Allow any Unicode — we only enforce length + "letters + digits mixture".
 */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200, "Password too long")
  .refine((s) => /[A-Za-z]/.test(s), "Password must contain a letter")
  .refine((s) => /[0-9]/.test(s), "Password must contain a digit");

/**
 * Slightly relaxed password schema for admin-initiated flows (reset / create)
 * — we allow 8+ so temporary admin-set passwords can be shorter than the
 * user-changed ones. User must still rotate on first login.
 */
export const adminSetPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);
