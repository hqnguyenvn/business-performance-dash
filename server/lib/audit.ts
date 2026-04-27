import type { Request } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { dataEvents } from "../schema";
import type { AuthedRequest } from "../auth/middleware";

export type DataAction = "create" | "update" | "delete";

export interface LogDataEventInput {
  req: AuthedRequest | Request;
  resource: string;
  resourceId?: string | null;
  action: DataAction;
  metadata?: Record<string, unknown> | null;
}

function extractIp(req?: Request): string | null {
  if (!req) return null;
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

/**
 * Fire-and-forget data mutation audit. Never throws — logging must not break
 * the request flow. Resource should match the table name (costs, revenues, ...).
 */
export async function logDataEvent(input: LogDataEventInput): Promise<void> {
  try {
    const authed = input.req as AuthedRequest;
    await db.insert(dataEvents).values({
      userId: authed.user?.id ?? null,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      action: input.action,
      ipAddress: extractIp(input.req),
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    console.error("[data-events] Failed to log:", err);
  }
}

export async function listDataEvents(resource: string, limit = 100) {
  return db
    .select()
    .from(dataEvents)
    .where(eq(dataEvents.resource, resource))
    .orderBy(desc(dataEvents.createdAt))
    .limit(limit);
}
