import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, extractDataArray } from '@/lib/apiProxy';
import { applyUserDataScope } from '@/utils/requestScope';
import { cookies } from 'next/headers';
import { CookieName, UserLevel } from '@/lib/constants';

const ALLOWED_PARAMS = ['fccode', 'fcba'];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const params = applyUserDataScope(req, new URLSearchParams(req.nextUrl.searchParams.toString()));

  // ────────────────────────────────────────────────────────────────────────────
  // 🛡️  GUARD: Restricted Override. Parameter `fcba` can be explicitly
  //     overridden ONLY by ADMINs for support/assistance purposes.
  // ────────────────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const userLevel = cookieStore.get(CookieName.SECURE_USER_LEVEL)?.value ||
                   cookieStore.get(CookieName.USER_LEVEL)?.value;
  const isAdmin = userLevel === UserLevel.ADMIN || userLevel === 'ADMIN';

  if (isAdmin && req.nextUrl.searchParams.has('fcba')) {
    params.set('fcba', req.nextUrl.searchParams.get('fcba')!);
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Filter allowed params for upstream
  const upstreamParams = new URLSearchParams();
  for (const param of ALLOWED_PARAMS) {
    const value = params.get(param);
    if (value) upstreamParams.append(param, value);
  }

  const url = `${BACKEND_URL}/api/master/sips-section${upstreamParams.toString() ? `?${upstreamParams}` : ''}`;
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
