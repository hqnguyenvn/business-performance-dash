import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { Response } from "express";
import { env, isProd } from "../env";

/**
 * Access token — short-lived JWT signed with JWT_SECRET.
 * Refresh token — random bytes, hashed in DB (user_sessions.refreshTokenHash).
 */

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: "Admin" | "Manager" | "User" | null;
  sid: string; // session id (user_sessions.id) — used for revocation checks
}

export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

export const ACCESS_TTL_SEC = 15 * 60; // 15 minutes
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Refresh cookie scoped to /api/auth so it's only sent on auth endpoints.
// This reduces attack surface and simplifies CSRF reasoning.
const REFRESH_COOKIE_PATH = "/api/auth";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL_SEC });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/** Generate a cryptographically random refresh token (base64url, 43 chars). */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: ACCESS_TTL_SEC * 1000,
    path: "/",
  });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: REFRESH_TTL_MS,
    path: REFRESH_COOKIE_PATH,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}
