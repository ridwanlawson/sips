import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { BACKEND_URL } from '@/utils/absensiProxy';
import { changePasswordRateLimiter } from '@/lib/rateLimiter';
import { validateCsrfToken } from '@/lib/csrf';

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(200, 'Password maksimal 200 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password harus mengandung simbol'),
});

export async function POST(request: Request) {
  try {
    // === RATE LIMITING ===
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    try {
      await changePasswordRateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Too many attempts. Try again in 1 minute.' },
        { status: 429 }
      );
    }

    // === CSRF VALIDATION ===
    const cookieStore = await cookies();
    const csrfToken = cookieStore.get('csrf_token')?.value;
    if (!csrfToken || !validateCsrfToken(request, csrfToken)) {
      return NextResponse.json({ ok: false, error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { current_password, new_password } = parsed.data;
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
    }

    const upstream = await fetch(`${BACKEND_URL}/api/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ current_password, new_password }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // SECURITY: Log original error details server-side but return generic message
      // to client to prevent information leakage (CWE-209).
      console.error('[CHANGE_PASSWORD_ERROR]', { status: upstream.status, data });
      return NextResponse.json(
        { ok: false, error: 'Failed to change password' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: data?.message || 'Password changed successfully',
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
