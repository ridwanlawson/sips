import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

  const data = await upstream.json();

  if (!upstream.ok) {
    console.error('[API_REGISTER_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: data?.message || 'Registration failed' },
      { status: upstream.status }
    );
  }

  return NextResponse.json({ ok: true, data });
}
