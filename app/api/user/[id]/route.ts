import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { cookies } from 'next/headers';
import { CookieName, UserLevel } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // === RATE LIMITING ===
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';
  try {
    await apiRateLimiter.consume(ip);
  } catch {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  // === IDOR PROTECTION (CWE-639) ===
  const cookieStore = await cookies();
  const authenticatedUserId = cookieStore.get(CookieName.LOG_ID)?.value;
  const userLevel = cookieStore.get(CookieName.SECURE_USER_LEVEL)?.value ||
                   cookieStore.get(CookieName.USER_LEVEL)?.value;

  const isAdmin = userLevel === UserLevel.ADMIN || userLevel === 'ADMIN';
  const isOwner = authenticatedUserId === id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden: You can only access your own profile' },
      { status: 403 }
    );
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
