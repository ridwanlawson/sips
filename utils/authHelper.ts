/**
 * Force logout user by clearing all cookies (including httpOnly) and redirecting to login page.
 * This function will ALWAYS logout the user, even if the token is invalid/expired.
 * Uses a special force-logout endpoint that can delete httpOnly cookies.
 */
import { getCsrfToken } from '@/lib/fetchWithCsrf';

const COOKIE_EXCLUDE = new Set(['NEXT_LOCALE']);

export const clearLoginCookies = () => {
  if (typeof window === 'undefined') return;

  const cookieNames = document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .filter(Boolean)
    .map(cookie => cookie.split('=')[0]);

  for (const name of cookieNames) {
    if (COOKIE_EXCLUDE.has(name)) continue;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  }
};

export const isUnauthenticatedJson = (json: unknown): boolean => {
  if (!json || typeof json !== 'object') return false;
  const body = json as Record<string, unknown>;
  const okFalse = body.ok === false || body.success === false;
  const message = String(body.error ?? body.message ?? '').toLowerCase();
  return okFalse && message.includes('unauthenticated');
};

export const isAuthErrorResponse = async (response: Response): Promise<boolean> => {
  if (response.status === 401) return true;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return false;

  try {
    const json = await response.clone().json();
    return isUnauthenticatedJson(json);
  } catch {
    return false;
  }
};

export const logoutAndRedirect = async () => {
  clearLoginCookies();

  try {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    // Use force-logout endpoint which can delete httpOnly cookies
    // This works even when the token is invalid
    await fetch('/api/auth/force-logout', {
      method: 'POST',
      headers,
      credentials: 'include',
    });
  } catch (e) {
    console.warn('Force logout API call failed:', e);
  }

  // Force reload to login page and clear any client state
  window.location.href = '/';
};
