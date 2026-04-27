import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { userSessions, type UserSession } from "../schema";
import { env } from "../env";
import { REFRESH_TTL_MS } from "./jwt";

/**
 * O(1) session lookup: store `HMAC-SHA256(JWT_SECRET, refreshToken)` as hex
 * in an indexed column. Equality lookup narrows to a single candidate, no
 * loop-and-bcrypt scan.
 */
function hashToken(token: string): string {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(token).digest("hex");
}

export interface CreateSessionInput {
  userId: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createSession(
  input: CreateSessionInput,
): Promise<UserSession> {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  const [row] = await db
    .insert(userSessions)
    .values({
      userId: input.userId,
      tokenLookup: hashToken(input.refreshToken),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    })
    .returning();
  return row;
}

/**
 * Find an active (non-revoked, non-expired) session by refresh token using
 * an indexed equality lookup. Replaces the previous O(N) bcrypt-compare scan.
 */
export async function findSessionByRefreshToken(
  refreshToken: string,
): Promise<UserSession | null> {
  const lookup = hashToken(refreshToken);
  const now = new Date();
  const [row] = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.tokenLookup, lookup),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Rotate: revoke the old session row and create a new one for the same user. */
export async function rotateSession(
  oldSession: UserSession,
  newRefreshToken: string,
  meta: { userAgent?: string | null; ipAddress?: string | null },
): Promise<UserSession> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.id, oldSession.id));
  return createSession({
    userId: oldSession.userId,
    refreshToken: newRefreshToken,
    userAgent: meta.userAgent ?? oldSession.userAgent,
    ipAddress: meta.ipAddress ?? oldSession.ipAddress,
  });
}

export async function revokeSessionById(id: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.id, id));
}

export async function revokeAllSessionsForUser(userId: string): Promise<number> {
  const result = await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)),
    )
    .returning({ id: userSessions.id });
  return result.length;
}

export async function isSessionActive(sessionId: string): Promise<boolean> {
  const [row] = await db
    .select({
      id: userSessions.id,
      revokedAt: userSessions.revokedAt,
      expiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .where(eq(userSessions.id, sessionId))
    .limit(1);
  if (!row) return false;
  if (row.revokedAt) return false;
  if (row.expiresAt <= new Date()) return false;
  return true;
}

export async function listSessionsForUser(
  userId: string,
): Promise<UserSession[]> {
  return db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)),
    );
}

/** Throttled lastUsedAt update — called from middleware on every authed request. */
const lastTouchedMemo = new Map<string, number>();
const TOUCH_THROTTLE_MS = 60_000;

export async function touchSession(sessionId: string): Promise<void> {
  const now = Date.now();
  const last = lastTouchedMemo.get(sessionId);
  if (last && now - last < TOUCH_THROTTLE_MS) return;
  lastTouchedMemo.set(sessionId, now);

  // Bound the memo so it can't grow unbounded if sessionIds keep rotating.
  if (lastTouchedMemo.size > 5000) {
    const entries = [...lastTouchedMemo.entries()].slice(-2500);
    lastTouchedMemo.clear();
    for (const [k, v] of entries) lastTouchedMemo.set(k, v);
  }

  await db
    .update(userSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(userSessions.id, sessionId));
}
