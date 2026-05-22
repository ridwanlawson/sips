import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/utils/absensiProxy';
import { authHeaders, extractDataArray } from '@/lib/apiProxy';

interface KaryawanRow {
  fcba?: string | number | null;
  sectionname?: string | null;
  gangcode?: string | null;
  [key: string]: unknown;
}

const ALLOWED_PARAMS = [
  'fcba',
  'afdeling',
  'sectionname',
  'gangcode',
  'noancak',
  'fctype',
  'fccompanycode',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const upstreamParams = new URLSearchParams();
  for (const param of ALLOWED_PARAMS) {
    const value = req.nextUrl.searchParams.get(param);
    if (value) upstreamParams.append(param, value);
  }

  const url = `${BACKEND_URL}/api/apps/karyawans${upstreamParams.toString() ? `?${upstreamParams}` : ''}`;

  const upstream = await fetch(url, {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  if (!upstream.ok) {
    let errorMessage = `Upstream returned ${upstream.status} ${upstream.statusText}`;
    try {
      if (upstream.headers.get('content-type')?.includes('application/json')) {
        const raw = await upstream.json();
        errorMessage = raw?.message || errorMessage;
      }
    } catch {
      /* keep default */
    }
    return NextResponse.json({ ok: false, error: errorMessage }, { status: upstream.status });
  }

  const raw = await upstream.json();
  const rows = extractDataArray(raw) as KaryawanRow[];
  return NextResponse.json({ ok: true, data: rows });
}
