const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '';

export const BACKEND_URL = backendUrl;

export const ABSENSI_BASE =
  process.env.ABSENSI_BASE || (backendUrl ? `${backendUrl}/api/apps/absensis` : '');

export const BACKEND_API_URL = backendUrl ? `${backendUrl}/api` : '';

export function backendApiUrl(path = '') {
  if (!BACKEND_API_URL) {
    throw new Error(
      'Missing backend URL. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL in the environment.'
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_API_URL}${normalizedPath}`;
}
