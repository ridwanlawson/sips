import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/utils/absensiProxy';
import { authHeaders } from '@/lib/apiProxy';

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const errorText = await response.text();
    // SECURITY: Log detailed upstream error server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[BUSINESS_UNITS_GET_ERROR]', { status: response.status, errorText });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch business units' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ ok: true, data });
}
