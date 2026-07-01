import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie, safeJson } from '@/utils/absensiProxy';
import { validateSecurity } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

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
