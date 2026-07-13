import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, parseJsonSafe, isRecord } from '@/lib/apiProxy';
import { validateSecurity } from '@/lib/security';
import { applyUserDataScope } from '@/utils/requestScope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KENDARAAN_BASE = `${BACKEND_URL}/api/master/sips-kendaraan`;

export async function GET(req: NextRequest) {
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const searchParams = new URLSearchParams(req.nextUrl.searchParams.toString());
  applyUserDataScope(req, searchParams);
  const url = `${KENDARAAN_BASE}?${searchParams.toString()}`;

  const upstream = await fetch(url, {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }

  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[KENDARAAN_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch kendaraan data' },
      { status: upstream.status }
    );
  }

  if (Array.isArray(data)) {
    return NextResponse.json({ ok: true, data });
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return NextResponse.json({ ok: true, data: data.data as unknown[] });
  }

  return NextResponse.json({ ok: true, data: [] });
}
