import type { Request, Response, NextFunction } from "express";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "./jwt";
import { hasPermissions, type AppRole } from "./permissions";
import { touchSession } from "./sessions";

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: AppRole | null;
    sessionId: string;
  };
}

/**
 * Read the access_token cookie, verify its signature/TTL, and attach req.user.
 *
 * **Performance note**: we DO NOT hit the database to check session revocation
 * on every request. The access token has a 15-minute TTL — session revocation
 * takes effect the next time the client calls `/auth/refresh`, which will fail
 * (the refresh lookup does check `user_sessions.revoked_at`). Worst-case stale
 * window for a revoked session = 15 minutes, which is an acceptable trade-off
 * for an ERP and avoids an extra SELECT+UPDATE per API call.
 *
 * `touchSession` is fire-and-forget and throttled to once-per-minute per
 * session in memory.
 */
export function attachUser(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) return next();
  const payload = verifyAccessToken(token);
  if (!payload?.sid) return next();

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sid,
  };

  // Fire-and-forget — throttled in sessions.ts
  touchSession(payload.sid).catch(() => {});

  next();
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Require specific permission(s). Assumes `attachUser` ran first.
 * All listed permissions must be present (AND semantics).
 */
export function requirePermission(...required: string[]) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const ok = await hasPermissions(req.user.role, required);
    if (!ok) {
      res.status(403).json({
        error: "Forbidden",
        required,
      });
      return;
    }
    next();
  };
}

export type { AppRole } from "./permissions";
