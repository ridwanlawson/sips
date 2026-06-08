import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BACKEND_URL } from '@/utils/absensiProxy';

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }
    const { username, password } = parsed.data;

    const upstream = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // SECURITY: Log original error details server-side but return generic message
      // to client to prevent information leakage (CWE-209).
      console.error('[AUTH_LOGIN_ERROR]', { status: upstream.status, data });
      return NextResponse.json(
        { ok: false, error: 'Invalid credentials or authentication error' },
        { status: upstream.status }
      );
    }

    const token = data?.token;
    const userId = data?.user?.id;
    const userKode = data?.user?.idkaryawan;
    const userFcba = data?.user?.fcba;
    const userAfdeling = data?.user?.afdeling;
    const userGang = data?.user?.gangcode;
    const userFullName = data?.user?.fullname;
    const userLevel = data?.user?.level;
    const userPosition = data?.user?.position;
    const userPhoto = data?.user?.photo;

    if (!token || !userId) {
      return NextResponse.json({ ok: false, error: 'Invalid login response' }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });

    // Base cookie utk auth (server-only)
    const base = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // Base cookie utk client-side info (client-readable)
    const clientBase = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // Set cookie auth & info user
    res.cookies.set('auth_token', String(token), base);
    res.cookies.set('log_id', String(userId), base);

    if (userKode) res.cookies.set('user_Kode', String(userKode), clientBase);
    if (userFcba) res.cookies.set('user_Fcba', String(userFcba), clientBase);
    if (userAfdeling) res.cookies.set('user_Afdeling', String(userAfdeling), clientBase);
    if (userGang) res.cookies.set('user_Gang', String(userGang), clientBase);
    if (userFullName) res.cookies.set('user_FullName', String(userFullName), clientBase);
    if (userLevel) res.cookies.set('user_Level', String(userLevel), clientBase);
    if (userPosition) res.cookies.set('user_Position', String(userPosition), clientBase);
    if (userPhoto) res.cookies.set('user_Photo', String(userPhoto), clientBase);

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
