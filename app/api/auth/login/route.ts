import { NextResponse } from 'next/server';

// Minimal typing for karyawan rows we get from upstream API.
// Keep fields optional because upstream data shape may vary.
interface KaryawanRow {
  fcba?: string | number | null;
  sectionname?: string | null;
  gangcode?: string | null;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const upstream = await fetch('http://dev.skj.my.id:82/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json({ ok: false, error: data?.message || 'Auth failed' }, { status: upstream.status });
    }

    const token = data?.token;
    const userId = data?.user?.id;
    const userKode = data?.user?.idkaryawan;
    const userFcba = data?.user?.fcba;
    const userAfdeling = data?.user?.afdeling;     // sectionname sumber user
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
      sameSite: 'lax' as const,
      path: '/',
    };

    // ====== 1) Set cookie auth & info user (server-only) ======
    res.cookies.set('auth_token', String(token), base);
    res.cookies.set('log_id', String(userId), base);
    res.cookies.set('user_Kode', String(userKode));
    res.cookies.set('user_Fcba', String(userFcba));
    res.cookies.set('user_Afdeling', String(userAfdeling));
    res.cookies.set('user_Gang', String(userGang));
    res.cookies.set('user_FullName', String(userFullName));
    res.cookies.set('user_Level', String(userLevel));
    res.cookies.set('user_Position', String(userPosition));
    res.cookies.set('user_Photo', String(userPhoto));

    // ====== 2) Ambil daftar karyawan utk opsi distinct (client-readable) ======
    try {
      const listRes = await fetch('http://dev.skj.my.id:82/api/apps/karyawans', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (listRes.ok) {
        const raw = await listRes.json();
  const rows: KaryawanRow[] = Array.isArray(raw?.data) ? (raw.data as KaryawanRow[]) : Array.isArray(raw) ? (raw as KaryawanRow[]) : [];

        // Uniq by triplet fcba|sectionname|gangcode
        const tripletMap = new Map<string, { fcba: string; sectionname: string; gangcode: string }>();
        for (const r of rows) {
          const fcba = String(r?.fcba ?? '').trim();
          const section = String(r?.sectionname ?? '').trim();
          const gang = String(r?.gangcode ?? '').trim();
          if (!fcba && !section && !gang) continue;
          const key = `${fcba}|${section}|${gang}`;
          if (!tripletMap.has(key)) tripletMap.set(key, { fcba, sectionname: section, gangcode: gang });
        }

        // Kumpulkan daftar distinct per kolom (kalau butuh)
        const fcbaArr = Array.from(new Set(Array.from(tripletMap.values()).map(v => v.fcba).filter(Boolean)));
        const sectionArr = Array.from(new Set(Array.from(tripletMap.values()).map(v => v.sectionname).filter(Boolean)));
        const gangArr = Array.from(new Set(Array.from(tripletMap.values()).map(v => v.gangcode).filter(Boolean)));

        // Simpan ke cookie non-HttpOnly agar bisa dibaca client
        const clientCookieBase = {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 hari
        };

        // PERINGATAN: batasi ukuran cookie (≈4KB). Jika data besar, pertimbangkan simpan di localStorage atau fetch saat dashboard dibuka.
        res.cookies.set('opt_fcba', JSON.stringify(fcbaArr.slice(0, 200)), clientCookieBase);
        res.cookies.set('opt_section', JSON.stringify(sectionArr.slice(0, 200)), clientCookieBase);
        res.cookies.set('opt_gang', JSON.stringify(gangArr.slice(0, 200)), clientCookieBase);

        // Simpan juga triplet unik (dibatasi agar tidak melebihi ukuran cookie)
        const triplets = Array.from(tripletMap.values());
        res.cookies.set('opt_triplets', JSON.stringify(triplets.slice(0, 150)), clientCookieBase);
      }
    } catch (e) {
      console.warn('[LOGIN] fetch karyawans (no params) gagal (non-fatal):', e);
    }

    return res;
  } catch (e) {
    console.error('[LOGIN]', e);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
