import rateLimit from "express-rate-limit";

/**
 * Rate limiters for sensitive auth endpoints. All are per-IP.
 *
 * - `authLoginLimiter` — login: 20/15min (complements the per-user lockout).
 * - `authSensitiveLimiter` — change-password/reset-password/refresh: 60/15min.
 * - `authGeneralLimiter` — other `/api/auth/*`: 200/15min.
 */

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

export const authSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

export const authGeneralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
