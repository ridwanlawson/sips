/**
 * Shared pure utility helpers.
 * Consolidates duplicated utility functions found across the codebase.
 */

/**
 * Safely convert a value to a number, returning 0 for invalid inputs.
 * Handles comma as decimal separator (Indonesian locale format).
 */
export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = String(value).replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

type ApiWrapper = {
  ok?: boolean;
  success?: boolean;
  data?: unknown;
};

/**
 * Extract an array of T from a standard API response.
 * Handles: plain array, { data: T[] }, { data: { data: T[] } }
 */
export function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const wrapped = payload as ApiWrapper;
  if (Array.isArray(wrapped.data)) return wrapped.data as T[];
  if (wrapped.data && typeof wrapped.data === 'object') {
    const inner = wrapped.data as ApiWrapper;
    if (Array.isArray(inner.data)) return inner.data as T[];
  }

  return [];
}

/**
 * Check if a value is a non-null object.
 */
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
