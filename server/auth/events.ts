import type { Request } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { authEvents } from "../schema";

export type AuthEventType =
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_change"
  | "password_reset_by_admin"
  | "role_change"
  | "user_created"
  | "user_deleted";

export interface LogAuthEventInput {
  userId?: string | null;
  email?: string | null;
  eventType: AuthEventType;
  req?: Request;
  metadata?: Record<string, unknown>;
}

function extractIp(req?: Request): string | null {
  if (!req) return null;
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

function extractUA(req?: Request): string | null {
  if (!req) return null;
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua : null;
}

/** Fire-and-forget audit log. Never throws — logging must not break the flow. */
export async function logAuthEvent(input: LogAuthEventInput): Promise<void> {
  try {
    await db.insert(authEvents).values({
      userId: input.userId ?? null,
      email: input.email ?? null,
      eventType: input.eventType,
      ipAddress: extractIp(input.req),
      userAgent: extractUA(input.req),
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error("[auth-events] Failed to log:", err);
  }
}

/** List recent events for a user (admin UI). */
export async function listAuthEventsForUser(
  userId: string,
  limit = 50,
) {
  return db
    .select()
    .from(authEvents)
    .where(eq(authEvents.userId, userId))
    .orderBy(desc(authEvents.createdAt))
    .limit(limit);
}
