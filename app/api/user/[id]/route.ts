import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { CookieName, UserLevel } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getTokenFromCookie();
  const cookieStore = await cookies();
  const loggedInUserId = cookieStore.get(CookieName.LOG_ID)?.value;
  const userLevel =
    cookieStore.get(CookieName.SECURE_USER_LEVEL)?.value ||
    cookieStore.get(CookieName.USER_LEVEL)?.value;

  if (!token || !loggedInUserId) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  // SECURITY: Prevent IDOR (Insecure Direct Object Reference) - CWE-639
  // Only allow users to access their own profile OR allow ADMIN level access.
  if (id !== loggedInUserId && userLevel !== UserLevel.ADMIN) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: You can only access your own profile' },
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
