// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const userId = cookieStore.get('log_id')?.value; // gunakan hanya jika upstream perlu path /user/{id}

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  // Ideal: upstream punya endpoint "me" berbasis token.
  // Kalau ADA: pakai /api/user/me (lebih aman)
  // const url = 'http://dev.skj.my.id:82/api/user/me';

  // Kalau TIDAK ADA & WAJIB /api/user/{id}:
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'User id missing' }, { status: 400 });
  }
  const url = `http://dev.skj.my.id:82/api/user/${encodeURIComponent(userId)}`;

  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    // credentials TIDAK perlu di sini karena ini server-to-server
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json({ ok: false, error: data?.message || 'Profile fetch failed' }, { status: upstream.status });
  }

  // Samakan kontrak respons untuk client
  return NextResponse.json({ ok: true, data });
}
