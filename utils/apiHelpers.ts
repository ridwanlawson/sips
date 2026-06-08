/**
 * Shared API response extraction helpers.
 * Used by attendance, harvest, and other client pages.
 */

export const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

/**
 * Extracts an array of T from a standard API payload:
 *   { ok: true, data: T[] }
 * or nested:
 *   { ok: true, data: { data: T[] } }
 */
export function extractArrayData<T>(payload: unknown): T[] {
    if (!isObject(payload)) return [];
    if ('ok' in payload && payload.ok === true && 'data' in payload) {
        const d = (payload as { data: unknown }).data;
        if (Array.isArray(d)) return d as T[];
        if (isObject(d) && 'data' in d && Array.isArray((d as { data: unknown }).data)) {
            return (d as { data: T[] }).data;
        }
    }
    return [];
}

/**
 * Extracts a single T from a standard API payload:
 *   { ok: true, data: { data: T } }
 * or:
 *   { ok: true, data: T }
 */
export function extractSingleData<T>(payload: unknown): T | null {
    if (!isObject(payload)) return null;
    if ('ok' in payload && payload.ok === true && 'data' in payload) {
        const d = (payload as { data: unknown }).data;
        if (isObject(d) && 'data' in d) {
            return (d as { data: unknown }).data as T;
        }
        return d as T;
    }
    return null;
}
