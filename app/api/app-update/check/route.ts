import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/utils/backendConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: 'Missing backend URL. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL.' },
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
    let json;
    try {
      json = data ? JSON.parse(data) : null;
    } catch {
      json = { message: data };
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
