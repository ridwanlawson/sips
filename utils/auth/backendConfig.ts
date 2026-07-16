import { env } from '@/lib/env';

const backendUrl = env.BACKEND_URL || '';
const isProduction = process.env.NODE_ENV === 'production';

// Warn jika production tapi URL tidak HTTPS
if (isProduction && backendUrl && !backendUrl.startsWith('https://')) {
  console.warn(
    '⚠️ SECURITY WARNING: BACKEND_URL should use HTTPS in production. ' +
      'Plaintext HTTP will expose passwords and tokens to MITM attacks.'
  );
}

export const BACKEND_URL = backendUrl;

export const ABSENSI_BASE =
  process.env.ABSENSI_BASE || (backendUrl ? `${backendUrl}/api/apps/absensis` : '');

export const BACKEND_API_URL = backendUrl ? `${backendUrl}/api` : '';

export function backendApiUrl(path = '') {
  if (!BACKEND_API_URL) {
    throw new Error(
      'Missing backend URL. Set BACKEND_URL in the environment.'
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_API_URL}${normalizedPath}`;
}
