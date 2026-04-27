/**
 * Convert object keys from camelCase → snake_case.
 * API responses giữ snake_case để match shape Supabase cũ → frontend không đổi.
 *
 * numeric columns trong PostgreSQL trả về dạng string ('123.45'); chúng ta
 * giữ nguyên vì toàn bộ service cũ cũng nhận string từ Supabase (Drizzle +
 * node-postgres cùng hành vi). Date object được serialize thành ISO string
 * tự động qua JSON.stringify.
 */
export function toSnake<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}

export function toSnakeArray<T extends Record<string, unknown>>(
  rows: T[],
): Record<string, unknown>[] {
  return rows.map(toSnake);
}

/**
 * Convert object keys from snake_case → camelCase.
 * Dùng cho request body (frontend gửi snake_case) → insert/update Drizzle
 * (cần camelCase).
 */
export function toCamel<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

/**
 * Drizzle + node-postgres trả numeric column dạng string. Supabase-js trả
 * dạng number. Để giữ shape API cũ, ta manually parse các field numeric
 * sau khi query ra.
 */
export function coerceNumeric<T extends Record<string, unknown>>(
  row: T,
  fields: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const f of fields) {
    const v = out[f];
    if (typeof v === "string" && v !== "") out[f] = Number(v);
  }
  return out;
}

export function coerceNumericArray<T extends Record<string, unknown>>(
  rows: T[],
  fields: readonly string[],
): Record<string, unknown>[] {
  return rows.map((r) => coerceNumeric(r, fields));
}
