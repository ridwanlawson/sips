import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { validateCsrfToken } from '@/lib/csrf';

/**
 * Validates CSRF token and applies rate limiting to a request.
 * Returns a NextResponse if validation fails, or null if it passes.
 */
export async function validateSecurity(req: NextRequest): Promise<NextResponse | null> {
  // === RATE LIMITING ===
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
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

  // === CSRF VALIDATION ===
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  if (!csrfToken || !validateCsrfToken(req, csrfToken)) {
    return NextResponse.json({ ok: false, error: 'Invalid CSRF token' }, { status: 403 });
  }

  return null;
}
