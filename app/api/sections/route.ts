import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, extractDataArray } from '@/lib/apiProxy';
import { applyUserDataScope } from '@/utils/requestScope';

const ALLOWED_PARAMS = ['fccode', 'fcba'];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const params = new URLSearchParams();
  for (const param of ALLOWED_PARAMS) {
    const value = request.nextUrl.searchParams.get(param);
    if (value) params.append(param, value);
  }

  // SECURITY: Enforce role-based data scoping (CWE-285 / IDOR protection).
  applyUserDataScope(request, params);

  const url = `${BACKEND_URL}/api/master/sips-section${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[SECTIONS_ERROR]', { status: response.status, error: errorText });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch sections' },
      { status: response.status }
    );
  }

  const data = extractDataArray(await response.json());
  return NextResponse.json({ ok: true, data });
}
