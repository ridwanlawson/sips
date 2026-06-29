import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, getTokenFromCookie, safeJson } from '@/utils/absensiProxy';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { validateCsrfToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // === RATE LIMITING ===
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

  // === CSRF VALIDATION ===
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  if (!csrfToken || !validateCsrfToken(req, csrfToken)) {
    return NextResponse.json({ ok: false, error: 'Invalid CSRF token' }, { status: 403 });
  }

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const form = await req.formData();

  const upstream = await fetch(`${BACKEND_URL}/api/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: form,
  });

  const data = await safeJson(upstream);

  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[API_REGISTER_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Registration failed' },
      { status: upstream.status }
    );
  }

  return NextResponse.json({ ok: true, data });
}
