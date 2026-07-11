import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/utils/absensiProxy';
import { authHeaders } from '@/lib/apiProxy';
import { validateSecurity } from '@/lib/security';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const securityError = await validateSecurity(request);
  if (securityError) return securityError;

  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(`${BACKEND_URL}/api/master/sips-businessunit`);
  for (const [key, value] of request.nextUrl.searchParams) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { headers: authHeaders(token) });

  if (!response.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    const errorText = await response.text();
    console.error('[BUSINESS_UNITS_ERROR]', { status: response.status, error: errorText });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch business units' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ ok: true, data });
}
