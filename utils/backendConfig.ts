const DEFAULT_BACKEND_URL = "http://dev.skj.my.id:82";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  DEFAULT_BACKEND_URL;

export const ABSENSI_BASE =
  process.env.ABSENSI_BASE || `${BACKEND_URL}/api/apps/absensis`;

export const BACKEND_API_URL = `${BACKEND_URL}/api`;

export function backendApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_API_URL}${normalizedPath}`;
}
