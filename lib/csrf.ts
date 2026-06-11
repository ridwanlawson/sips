/**
 * CSRF Token Generator & Validator
 * Melindungi dari Cross-Site Request Forgery (CSRF) attacks
 *
 * Note: Uses Web Crypto API for Edge Runtime compatibility
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

export interface CsrfTokenResult {
  token: string;
  cookie: string;
}

/**
 * Generate random string for CSRF token
 * Uses Web Crypto API which works in Edge Runtime
 */
function generateRandomHex(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, length * 2);
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): CsrfTokenResult {
  const token = generateRandomHex(CSRF_TOKEN_LENGTH / 2); // 32 chars = 16 bytes hex
  const cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`;
  return { token, cookie };
}

/**
 * Validate CSRF token from request
 * Note: Simple string comparison (crypto.timingSafeEqual not available in Edge)
 * For production, consider using a timing-safe comparison if available
 */
export function validateCsrfToken(request: Request, cookieToken: string | undefined): boolean {
  if (!cookieToken) return false;

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return false;

  // Simple string comparison
  // In production with Node runtime, consider using timingSafeEqual
  return cookieToken === headerToken;
}

/**
 * Get CSRF token from cookies
 */
export function getCsrfTokenFromCookies(cookies: string): string | null {
  const match = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Middleware untuk set CSRF token di semua response
 */
export function setCsrfCookie(response: Response, token: string): Response {
  response.headers.set(
    'Set-Cookie',
    `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
  );
  return response;
}
