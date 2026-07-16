import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CookieName } from '@/lib/constants';
import { apiRateLimiter } from '@/lib/auth/rateLimiter';
import { validateSecurity } from '@/lib/auth/security';

/**
 * Force logout endpoint that clears all cookies regardless of token validity.
 * Used when token is invalid/expired and normal logout fails.
 *
 * CSRF strategy (hybrid):
 * - Try CSRF validation first using validateSecurity()
 * - If CSRF passes or fails → always clear cookies
 * - This avoids deadlock when CSRF cookie is already expired
 * - Acceptable trade-off: CSRF can at worst cause a logout DoS, not data breach
 */
const COOKIES_TO_DELETE = [
  CookieName.AUTH_TOKEN,
  CookieName.LOG_ID,
  CookieName.USER_FULL_NAME,
  CookieName.USER_LEVEL,
  CookieName.USER_FCBA,
  CookieName.USER_AFDELING,
  CookieName.USER_GANG,
  CookieName.USER_KODE,
  CookieName.USER_POSITION,
  CookieName.USER_PHOTO,
  // Legacy / inconsistent variants
  'user_Section',
  'user_SECTION',
  'user_section',
  'user_afdeling',
  'user_FCBA',
  'user_fcba',
  'user_LEVEL',
  'user_level',
  'user_GANG',
  'user_gang',
  // Options
  CookieName.OPT_FCBA,
  CookieName.OPT_SECTION,
  CookieName.OPT_GANG,
  CookieName.OPT_TRIPLETS,
  CookieName.SECURE_USER_LEVEL,
  CookieName.SECURE_USER_FCBA,
  CookieName.SECURE_USER_AFDELING,
  CookieName.SECURE_USER_GANG,
  CookieName.CSRF_TOKEN,
];

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    try {
      await apiRateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Try again later.' },
        { status: 429 }
      );
    }

    // Hybrid CSRF: validate if possible, but never block logout
    const csrfError = await validateSecurity(req);
    if (csrfError) {
      console.warn('[FORCE_LOGOUT] CSRF validation failed, proceeding anyway');
    }

    const cookieStore = await cookies();

    for (const name of COOKIES_TO_DELETE) {
      cookieStore.delete(name);
    }

    return NextResponse.json({ ok: true, message: 'All cookies cleared successfully' });
  } catch {
    return NextResponse.json({ ok: true, message: 'Logout completed with warnings' });
  }
}

