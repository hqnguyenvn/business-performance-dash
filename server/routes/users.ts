import { Router, type Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, userRoles, profiles } from "../schema";
import { hashPassword } from "../auth/password";
import { requireAuth, requirePermission, type AuthedRequest } from "../auth/middleware";
import { PERM } from "../auth/permissions";
import {
  listSessionsForUser,
  revokeAllSessionsForUser,
  revokeSessionById,
} from "../auth/sessions";
import { logAuthEvent } from "../auth/events";
import {
  validateBody,
  validateParams,
  paramsWithId,
  adminSetPasswordSchema,
} from "../lib/validate";

export const usersRouter = Router();

const appRoleSchema = z.enum(["Admin", "Manager", "User"]);

const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: adminSetPasswordSchema,
    full_name: z.string().trim().max(255).optional(),
    role: appRoleSchema,
  })
  .strict();

const updateUserSchema = z
  .object({
    role: appRoleSchema.optional(),
    is_active: z.boolean().optional(),
    full_name: z.string().trim().max(255).optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
  })
  .strict();

const resetPasswordSchema = z
  .object({ password: adminSetPasswordSchema })
  .strict();

usersRouter.use(requireAuth);
usersRouter.use(requirePermission(PERM.USERS_MANAGE));

/**
 * GET /api/users
 * Return list of users with profile + role merged, shaped for UserManagementTable.
 */
usersRouter.get("/", async (_req, res: Response) => {
  const rows = await db
    .select({
      userRoleId: userRoles.id,
      userId: userRoles.userId,
      role: userRoles.role,
      isActive: userRoles.isActive,
      email: users.email,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      mustChangePassword: users.mustChangePassword,
      lastLoginAt: users.lastLoginAt,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
    })
    .from(userRoles)
    .leftJoin(users, eq(userRoles.userId, users.id))
    .leftJoin(profiles, eq(userRoles.userId, profiles.id));

  res.json(
    rows.map((r) => ({
      id: r.userRoleId,
      user_id: r.userId,
      email: r.email ?? "",
      full_name: r.fullName ?? "",
      avatar_url: r.avatarUrl ?? "",
      role: r.role,
      is_active: r.isActive,
      must_change_password: r.mustChangePassword ?? false,
      last_login_at: r.lastLoginAt,
      locked_until: r.lockedUntil,
      created_at: r.createdAt,
    })),
  );
});

/**
 * POST /api/users
 * Body: { email, password, full_name?, role }
 * Creates user + profile + user_role. New users always start with
 * must_change_password=true so the admin doesn't need to remember their
 * initial password.
 */
usersRouter.post(
  "/",
  validateBody(createUserSchema),
  async (req: AuthedRequest, res: Response) => {
    const { email, password, full_name, role } = req.valid!.body as z.infer<
      typeof createUserSchema
    >;
    const normalizedEmail = email;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      emailConfirmedAt: new Date(),
      mustChangePassword: true, // first-login forced change
    })
    .returning();

  await db.insert(profiles).values({
    id: newUser.id,
    email: normalizedEmail,
    fullName: typeof full_name === "string" && full_name.trim() ? full_name.trim() : null,
  });

  const [roleRow] = await db
    .insert(userRoles)
    .values({
      userId: newUser.id,
      role,
      isActive: true,
    })
    .returning();

  await logAuthEvent({
    userId: newUser.id,
    email: normalizedEmail,
    eventType: "user_created",
    req,
    metadata: { role, createdBy: req.user?.id },
  });

    res.status(201).json({
      id: roleRow.id,
      user_id: newUser.id,
      email: normalizedEmail,
      full_name: full_name ?? "",
      role,
      is_active: true,
      must_change_password: true,
    });
  },
);

/**
 * PUT /api/users/:id — id = user_roles.id
 */
usersRouter.put(
  "/:id",
  validateParams(paramsWithId),
  validateBody(updateUserSchema),
  async (req: AuthedRequest, res: Response) => {
  const { role, is_active, full_name, email } = req.valid!.body as z.infer<
    typeof updateUserSchema
  >;

  const [existingRole] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, req.params.id))
    .limit(1);
  if (!existingRole) return res.status(404).json({ error: "Not found" });

  const roleUpdate: Partial<typeof userRoles.$inferInsert> = {};
  const logMetadata: Record<string, unknown> = {};

  if (role !== undefined) {
    if (role !== existingRole.role) {
      logMetadata.oldRole = existingRole.role;
      logMetadata.newRole = role;
    }
    roleUpdate.role = role;
  }
  if (is_active !== undefined) {
    roleUpdate.isActive = !!is_active;
  }
  if (Object.keys(roleUpdate).length > 0) {
    await db
      .update(userRoles)
      .set(roleUpdate)
      .where(eq(userRoles.id, req.params.id));
  }

  if (full_name !== undefined) {
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, existingRole.userId))
      .limit(1);
    if (existingProfile) {
      await db
        .update(profiles)
        .set({ fullName: full_name, updatedAt: new Date() })
        .where(eq(profiles.id, existingRole.userId));
    } else {
      await db.insert(profiles).values({
        id: existingRole.userId,
        fullName: full_name,
      });
    }
  }

  if (typeof email === "string" && email.trim()) {
    const normalizedEmail = email.toLowerCase().trim();
    const [clash] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (clash && clash.id !== existingRole.userId) {
      return res.status(409).json({ error: "Email already in use" });
    }
    await db
      .update(users)
      .set({ email: normalizedEmail, updatedAt: new Date() })
      .where(eq(users.id, existingRole.userId));
  }

  if (logMetadata.oldRole) {
    await logAuthEvent({
      userId: existingRole.userId,
      eventType: "role_change",
      req,
      metadata: logMetadata,
    });
  }

  res.json({ ok: true });
  },
);

/**
 * DELETE /api/users/:id — id = user_roles.id
 */
usersRouter.delete(
  "/:id",
  validateParams(paramsWithId),
  async (req: AuthedRequest, res: Response) => {
  const [roleRow] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, req.params.id))
    .limit(1);
  if (!roleRow) return res.status(404).json({ error: "Not found" });

  // Don't let an admin delete themselves
  if (req.user?.id === roleRow.userId) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.id, roleRow.userId))
    .limit(1);

  // Cascade will drop profile, user_roles, user_sessions
  await db.delete(users).where(eq(users.id, roleRow.userId));

  await logAuthEvent({
    userId: null,
    email: userRow?.email ?? null,
    eventType: "user_deleted",
    req,
    metadata: { deletedBy: req.user?.id },
  });

  res.status(204).send();
  },
);

/**
 * POST /api/users/:id/reset-password
 * Admin resets the password and forces must_change_password=true.
 * Also revokes every active session of that user.
 */
usersRouter.post(
  "/:id/reset-password",
  validateParams(paramsWithId),
  validateBody(resetPasswordSchema),
  async (req: AuthedRequest, res: Response) => {
  const { password } = req.valid!.body as z.infer<typeof resetPasswordSchema>;

  const [roleRow] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, req.params.id))
    .limit(1);
  if (!roleRow) return res.status(404).json({ error: "Not found" });

  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, roleRow.userId));

  // Revoke every active session so stale cookies become invalid.
  await revokeAllSessionsForUser(roleRow.userId);

  await logAuthEvent({
    userId: roleRow.userId,
    eventType: "password_reset_by_admin",
    req,
    metadata: { resetBy: req.user?.id },
  });

  res.json({ ok: true });
  },
);

/**
 * POST /api/users/:id/unlock — clear failed_login_attempts + locked_until.
 */
usersRouter.post(
  "/:id/unlock",
  validateParams(paramsWithId),
  async (req: AuthedRequest, res: Response) => {
  const [roleRow] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, req.params.id))
    .limit(1);
  if (!roleRow) return res.status(404).json({ error: "Not found" });

  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, roleRow.userId));

  res.json({ ok: true });
  },
);

/**
 * GET /api/users/:id/sessions — list active sessions for a target user.
 */
usersRouter.get(
  "/:id/sessions",
  validateParams(paramsWithId),
  async (req, res: Response) => {
  const [roleRow] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, req.params.id))
    .limit(1);
  if (!roleRow) return res.status(404).json({ error: "Not found" });

  const sessions = await listSessionsForUser(roleRow.userId);
  res.json(
    sessions.map((s) => ({
      id: s.id,
      user_agent: s.userAgent,
      ip_address: s.ipAddress,
      created_at: s.createdAt,
      last_used_at: s.lastUsedAt,
      expires_at: s.expiresAt,
    })),
  );
  },
);

/**
 * DELETE /api/users/:id/sessions — revoke all active sessions.
 */
usersRouter.delete(
  "/:id/sessions",
  validateParams(paramsWithId),
  async (req: AuthedRequest, res: Response) => {
    const [roleRow] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.id, req.params.id))
      .limit(1);
    if (!roleRow) return res.status(404).json({ error: "Not found" });

    const count = await revokeAllSessionsForUser(roleRow.userId);

    await logAuthEvent({
      userId: roleRow.userId,
      eventType: "logout",
      req,
      metadata: { scope: "all", revokedBy: req.user?.id, revoked: count },
    });

    res.json({ ok: true, revoked: count });
  },
);

/**
 * DELETE /api/users/:id/sessions/:sessionId
 * Revoke a single session.
 */
usersRouter.delete(
  "/:id/sessions/:sessionId",
  async (req: AuthedRequest, res: Response) => {
    const [roleRow] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.id, req.params.id))
      .limit(1);
    if (!roleRow) return res.status(404).json({ error: "Not found" });

    await revokeSessionById(req.params.sessionId);
    res.status(204).send();
  },
);
