/**
 * Fetch wrapper cho backend API.
 *
 * - Tất cả request gửi kèm cookie (`credentials: include`)
 * - Base path: `/api` (Vite proxy sang backend trong dev, same-origin trong prod)
 * - Trên 401 (không phải các endpoint `/auth/`), tự gọi `/auth/refresh` 1 lần rồi retry
 * - Nếu refresh thất bại, emit sự kiện `auth:session-expired` (AuthContext listen)
 * - Parse error: hỗ trợ cả `{ error: "msg" }` và `{ error: { message, code } }`
 */

const BASE = "/api";

/** Event name emitted when refresh fails and the user should be logged out. */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

function emitSessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

// Singleton: shared promise while a refresh is in flight. Cached for a short
// TTL after resolution so requests that 401 right after a successful refresh
// reuse the result instead of triggering a second refresh.
let refreshInFlight: Promise<boolean> | null = null;
let refreshResolvedAt = 0;
const REFRESH_RESULT_TTL_MS = 1000;

async function attemptRefresh(): Promise<boolean> {
  // If a refresh finished very recently and succeeded, treat as still valid
  // (the new cookies are already in place, no need to hit /auth/refresh).
  if (
    refreshInFlight === null &&
    Date.now() - refreshResolvedAt < REFRESH_RESULT_TTL_MS
  ) {
    return true;
  }
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const ok = res.ok;
      if (!ok) emitSessionExpired();
      return ok;
    } catch {
      emitSessionExpired();
      return false;
    } finally {
      refreshResolvedAt = Date.now();
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { credentials: "include", ...init });
}

/** Normalize a `{ error }` response body into a user-readable string. */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const obj = err as Record<string, unknown>;
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.code === "string") return obj.code;
    }
  }
  return fallback;
}

async function request<T>(
  path: string,
  init: RequestInit & { query?: Record<string, unknown> } = {},
): Promise<T> {
  const { query, ...rest } = init;

  let url = `${BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) params.append(k, String(item));
      } else {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const doRequest = () => doFetch(url, { ...rest, headers });

  let res = await doRequest();

  // Auto-refresh on 401 (skip for /auth/* to avoid loops).
  const isAuthEndpoint = path.startsWith("/auth/");
  if (res.status === 401 && !isAuthEndpoint) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      res = await doRequest();
      if (res.status === 401) {
        // Still 401 after refresh — session is dead.
        emitSessionExpired();
      }
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = extractErrorMessage(data, res.statusText);
    } catch {
      // ignore JSON parse errors
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const api = {
  get<T>(path: string, query?: Record<string, unknown>) {
    return request<T>(path, { method: "GET", query });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },
};
