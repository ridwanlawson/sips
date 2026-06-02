import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/utils/backendConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal (konfigurasi).' },
      { status: 500 }
    );
  }

  const body = await req.json();
  const authorization = req.headers.get('authorization') ?? '';

  try {
    const upstream = await fetch(`https://skj.my.id/app_archive.asp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.text();

    if (!upstream.ok) {
      // SECURITY: Log original error details server-side but return generic message
      // to client to prevent information leakage (CWE-209).
      console.error('[APP_UPDATE_CHECK_ERROR]', {
        status: upstream.status,
        error: data.length > 1000 ? data.substring(0, 1000) + '...' : data,
      });
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat memeriksa update aplikasi.' },
        { status: upstream.status }
      );
    }

    let json;
    try {
      json = data ? JSON.parse(data) : null;
    } catch {
      console.error('[APP_UPDATE_CHECK_PARSE_ERROR]', { data });
      return NextResponse.json(
        { message: 'Terjadi kesalahan saat memproses data update.' },
        { status: 502 }
      );
    }

    return NextResponse.json(json, { status: upstream.status });
  } catch (error) {
    console.error('Error proxying app-update/check:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memeriksa update aplikasi.' },
      { status: 500 }
    );
  }
}
