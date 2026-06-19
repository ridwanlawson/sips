const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '';
const isProduction = process.env.NODE_ENV === 'production';

// Enforce HTTPS for BACKEND_URL in production (CWE-319)
if (isProduction && backendUrl && !backendUrl.startsWith('https://')) {
  throw new Error(
    '🛑 SECURITY ERROR: BACKEND_URL must use HTTPS in production. ' +
      'Plaintext HTTP is forbidden as it exposes sensitive credentials to MITM attacks.'
  );
}

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
