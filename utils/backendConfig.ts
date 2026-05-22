function requiredBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error(
      'Missing backend URL. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL in the environment.'
    );
  }

  return backendUrl;
}

export const BACKEND_URL = requiredBackendUrl();

export const ABSENSI_BASE = process.env.ABSENSI_BASE || `${BACKEND_URL}/api/apps/absensis`;

export const BACKEND_API_URL = `${BACKEND_URL}/api`;

export function backendApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_API_URL}${normalizedPath}`;
}
