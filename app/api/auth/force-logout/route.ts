import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CookieName } from '@/lib/constants';
import { apiRateLimiter } from '@/lib/rateLimiter';

/**
 * Force logout endpoint that clears all cookies regardless of token validity.
 * Used when token is invalid/expired and normal logout fails.
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
    // Rate limiting only — CSRF is intentionally skipped for this last-resort
    // endpoint. When called after session expiry, the CSRF cookie may already
    // be inaccessible, making CSRF validation impossible and creating a
    // deadlock where the user can never log out.
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

    const cookieStore = await cookies();

    for (const name of COOKIES_TO_DELETE) {
      cookieStore.delete(name);
    }

    return NextResponse.json({ ok: true, message: 'All cookies cleared successfully' });
  } catch {
    // Even on error, return success because logout should continue anyway.
    return NextResponse.json({ ok: true, message: 'Logout completed with warnings' });
  }
}
