import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { validateCsrfToken } from '@/lib/csrf';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Validates CSRF token and applies rate limiting to a request.
 * Returns a NextResponse if validation fails, or null if it passes.
 *
 * CSRF validation is skipped for safe methods (GET, HEAD, OPTIONS).
 */
export async function validateSecurity(
  req: Request | NextRequest,
  rateLimiter: RateLimiterMemory = apiRateLimiter
): Promise<NextResponse | null> {
  // === RATE LIMITING ===
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  try {
    await rateLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: 'Too many requests. Try again later.',
        message: 'Too many requests. Try again later.',
      },
      { status: 429 }
    );
  }

  // === CSRF VALIDATION ===
  // Skip CSRF for safe methods (CWE-352)
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  if (!csrfToken || !validateCsrfToken(req as Request, csrfToken)) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: 'Invalid CSRF token',
        message: 'Invalid CSRF token',
      },
      { status: 403 }
    );
  }

  return null;
}
