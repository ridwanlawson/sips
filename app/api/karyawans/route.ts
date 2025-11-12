// app/api/karyawans/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const upstream = await fetch('http://dev.skj.my.id:82/api/apps/karyawans', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      // tanpa parameter
      cache: 'no-store',
    });

    const raw = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ ok: false, error: raw?.message || 'Upstream error' }, { status: upstream.status });
    }

    // Normalisasi: pastikan array ada di raw.data atau raw
    const rows: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
    console.error('[KARYAWANS]', e);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
