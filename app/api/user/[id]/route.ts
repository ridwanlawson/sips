import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { validateSecurity } from '@/lib/security';
import { UserLevel, CookieName } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;
  const cookieStore = await cookies();
  const loggedId = cookieStore.get(CookieName.LOG_ID)?.value;
  const userLevel = cookieStore.get(CookieName.SECURE_USER_LEVEL)?.value ||
                    cookieStore.get(CookieName.USER_LEVEL)?.value;

  // SECURITY: IDOR Protection (CWE-639)
  // Users can only view their own profile, unless they are an ADMIN.
  const isAdmin = userLevel === UserLevel.ADMIN || userLevel === 'ADMIN';
  if (id !== loggedId && !isAdmin) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const upstream = await fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    console.error('[API_USER_GET_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch user data' },
      { status: upstream.status }
    );
  }

  return NextResponse.json({ ok: true, data });
}
