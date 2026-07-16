import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/utils/auth/backendConfig';
import { env } from '@/lib/env';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { apiRateLimiter } from '@/lib/auth/rateLimiter';
import { validateCsrfToken } from '@/lib/auth/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateCheckSchema = z.object({
  action: z.string().min(1).max(50),
  platform: z.string().min(1).max(50),
  app_name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal (konfigurasi).' },
      { status: 500 }
    );
  }

  try {
    // === RATE LIMITING ===
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    try {
      await apiRateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    // === CSRF VALIDATION ===
    const cookieStore = await cookies();
    const csrfToken = cookieStore.get('csrf_token')?.value;
    if (!csrfToken || !validateCsrfToken(req, csrfToken)) {
      return NextResponse.json({ message: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Input tidak valid.' }, { status: 400 });
    }

    const authorization = req.headers.get('authorization') ?? '';

    if (!env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ message: 'Server not configured' }, { status: 500 });
    }
    const upstream = await fetch(`${env.NEXT_PUBLIC_SITE_URL}/app_archive.asp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(parsed.data),
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

