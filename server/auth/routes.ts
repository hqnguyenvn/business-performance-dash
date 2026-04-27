import { Router, type Response } from "express";
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { users, userRoles, profiles, userSessions } from "../schema";
import { hashPassword, verifyPassword } from "./password";
import {
  validateBody,
  passwordSchema,
} from "../lib/validate";
import {
  authLoginLimiter,
  authSensitiveLimiter,
  authGeneralLimiter,
} from "../lib/rateLimit";
import {
  signAccessToken,
  generateRefreshToken,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  REFRESH_COOKIE_NAME,
} from "./jwt";
import {
  createSession,
  findSessionByRefreshToken,
  rotateSession,
  revokeSessionById,
  revokeAllSessionsForUser,
  listSessionsForUser,
} from "./sessions";
import { getPermissionsForRole, type AppRole } from "./permissions";
import { logAuthEvent } from "./events";
import {
  type AuthedRequest,
  attachUser,
  requireAuth,
} from "./middleware";

export const authRouter = Router();

// attachUser runs before every auth route so /me/refresh can read the cookie.
authRouter.use(attachUser);
authRouter.use(authGeneralLimiter);

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------
const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(1).max(200),
  })
  .strict();

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1).max(200),
    new_password: passwordSchema,
  })
  .strict();

const updateProfileSchema = z
  .object({
    full_name: z.string().trim().max(255).nullable().optional(),
    avatar_url: z.string().max(500_000).nullable().optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
  })
  .strict();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function getUserRole(userId: string): Promise<AppRole | null> {
  const [row] = await db
    .select({ role: userRoles.role, isActive: userRoles.isActive })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1);
  return row?.isActive ? (row.role as AppRole) : null;
}

async function issueTokensForUser(
  userId: string,
  email: string,
  role: AppRole | null,
  res: Response,
  meta: { userAgent?: string | null; ipAddress?: string | null },
) {
  const refreshToken = generateRefreshToken();
  const session = await createSession({
    userId,
    refreshToken,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });
  const accessToken = signAccessToken({
    sub: userId,
    email,
    role,
    sid: session.id,
  });
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
  return { session, accessToken, refreshToken };
}

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
authRouter.post("/login", authLoginLimiter, validateBody(loginSchema), async (req, res: Response) => {
  const { email, password } = req.valid!.body as z.infer<typeof loginSchema>;
  const normalizedEmail = email;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    await logAuthEvent({
      email: normalizedEmail,
      eventType: "login_failed",
      req,
      metadata: { reason: "user_not_found" },
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000,
    );
    await logAuthEvent({
      userId: user.id,
      email: normalizedEmail,
      eventType: "login_failed",
      req,
      metadata: { reason: "locked", minutesLeft },
    });
    return res.status(429).json({
      error: `Account is locked. Try again in ${minutesLeft} minute(s).`,
    });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const newFailed = user.failedLoginAttempts + 1;
    const patch: Partial<typeof users.$inferInsert> = {
      failedLoginAttempts: newFailed,
      updatedAt: new Date(),
    };
    if (newFailed >= MAX_FAILED_ATTEMPTS) {
      patch.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      patch.failedLoginAttempts = 0;
    }
    await db.update(users).set(patch).where(eq(users.id, user.id));
    await logAuthEvent({
      userId: user.id,
      email: normalizedEmail,
      eventType: "login_failed",
      req,
      metadata: { reason: "bad_password", attempt: newFailed },
    });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Success — reset counters, set lastLoginAt, issue tokens
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const role = await getUserRole(user.id);
  await issueTokensForUser(user.id, user.email, role, res, {
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  });

  const permissions = await getPermissionsForRole(role);

  await logAuthEvent({
    userId: user.id,
    email: user.email,
    eventType: "login_success",
    req,
  });

  return res.json({
    user: { id: user.id, email: user.email },
    role,
    permissions,
    mustChangePassword: user.mustChangePassword,
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/refresh
// -----------------------------------------------------------------------------
authRouter.post("/refresh", authSensitiveLimiter, async (req, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  const oldSession = await findSessionByRefreshToken(refreshToken);
  if (!oldSession) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  // Look up user (email may have changed since issue)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, oldSession.userId))
    .limit(1);
  if (!user) {
    await revokeSessionById(oldSession.id);
    clearAuthCookies(res);
    return res.status(401).json({ error: "User not found" });
  }

  // Rotate refresh token
  const newRefreshToken = generateRefreshToken();
  const newSession = await rotateSession(oldSession, newRefreshToken, {
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  });

  const role = await getUserRole(user.id);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role,
    sid: newSession.id,
  });
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, newRefreshToken);

  return res.json({ ok: true });
});

// -----------------------------------------------------------------------------
// GET /api/auth/me
// -----------------------------------------------------------------------------
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const u = req.user!;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, u.id))
    .limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, u.id))
    .limit(1);

  const permissions = await getPermissionsForRole(u.role);

  return res.json({
    user: { id: user.id, email: user.email },
    role: u.role,
    permissions,
    mustChangePassword: user.mustChangePassword,
    profile: profile
      ? { fullName: profile.fullName, avatarUrl: profile.avatarUrl }
      : null,
  });
});

// -----------------------------------------------------------------------------
// POST /api/auth/logout  (revoke current session only)
// -----------------------------------------------------------------------------
authRouter.post("/logout", async (req: AuthedRequest, res) => {
  if (req.user?.sessionId) {
    await revokeSessionById(req.user.sessionId);
    await logAuthEvent({
      userId: req.user.id,
      email: req.user.email,
      eventType: "logout",
      req,
    });
  }
  clearAuthCookies(res);
  return res.json({ ok: true });
});

// -----------------------------------------------------------------------------
// POST /api/auth/logout-all  (revoke every session of this user)
// -----------------------------------------------------------------------------
authRouter.post(
  "/logout-all",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const u = req.user!;
    const count = await revokeAllSessionsForUser(u.id);
    await logAuthEvent({
      userId: u.id,
      email: u.email,
      eventType: "logout",
      req,
      metadata: { scope: "all", revoked: count },
    });
    clearAuthCookies(res);
    return res.json({ ok: true, revoked: count });
  },
);

// -----------------------------------------------------------------------------
// POST /api/auth/change-password  (first-login flow + voluntary change)
// -----------------------------------------------------------------------------
authRouter.post(
  "/change-password",
  authSensitiveLimiter,
  requireAuth,
  validateBody(changePasswordSchema),
  async (req: AuthedRequest, res: Response) => {
    const u = req.user!;
    const { current_password, new_password } = req.valid!.body as z.infer<
      typeof changePasswordSchema
    >;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, u.id))
      .limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await verifyPassword(current_password, user.passwordHash);
    if (!ok) {
      await logAuthEvent({
        userId: u.id,
        email: u.email,
        eventType: "login_failed",
        req,
        metadata: { reason: "bad_current_password_on_change" },
      });
      return res.status(401).json({ error: "Current password incorrect" });
    }

    const passwordHash = await hashPassword(new_password);
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, u.id));

    // Revoke all OTHER sessions (keep current one active so the user stays
    // logged in without re-authenticating).
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(userSessions.userId, u.id),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .execute();

    // Re-issue tokens for the current session (old ones were just revoked above).
    const role = await getUserRole(u.id);
    await issueTokensForUser(u.id, user.email, role, res, {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    });

    await logAuthEvent({
      userId: u.id,
      email: u.email,
      eventType: "password_change",
      req,
    });

    return res.json({ ok: true });
  },
);

// -----------------------------------------------------------------------------
// PUT /api/auth/profile  (update own profile)
// -----------------------------------------------------------------------------
authRouter.put(
  "/profile",
  requireAuth,
  validateBody(updateProfileSchema),
  async (req: AuthedRequest, res: Response) => {
    const u = req.user!;
    const { full_name, avatar_url, email } = req.valid!.body as z.infer<
      typeof updateProfileSchema
    >;

    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, u.id))
      .limit(1);

    const profilePatch: Record<string, unknown> = { updatedAt: new Date() };
    if (full_name !== undefined) profilePatch.fullName = full_name;
    if (avatar_url !== undefined) profilePatch.avatarUrl = avatar_url;

    if (existing) {
      await db.update(profiles).set(profilePatch).where(eq(profiles.id, u.id));
    } else {
      await db.insert(profiles).values({
        id: u.id,
        fullName: full_name ?? null,
        avatarUrl: avatar_url ?? null,
        email: typeof email === "string" ? email : u.email,
      });
    }

    if (typeof email === "string" && email.trim() && email.trim() !== u.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const [clash] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      if (clash && clash.id !== u.id) {
        return res.status(409).json({ error: "Email already in use" });
      }
      await db
        .update(users)
        .set({ email: normalizedEmail, updatedAt: new Date() })
        .where(eq(users.id, u.id));
    }

    return res.json({ ok: true });
  },
);

// -----------------------------------------------------------------------------
// GET /api/auth/sessions  (list active sessions for current user)
// -----------------------------------------------------------------------------
authRouter.get(
  "/sessions",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    const u = req.user!;
    const sessions = await listSessionsForUser(u.id);
    return res.json(
      sessions.map((s) => ({
        id: s.id,
        user_agent: s.userAgent,
        ip_address: s.ipAddress,
        created_at: s.createdAt,
        last_used_at: s.lastUsedAt,
        expires_at: s.expiresAt,
        current: s.id === u.sessionId,
      })),
    );
  },
);
