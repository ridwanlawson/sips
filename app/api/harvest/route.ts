import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { buildFilteredUrl, getTokenFromCookie, safeJson, BACKEND_URL } from '@/utils/absensiProxy';
import { applyUserDataScope } from '@/utils/requestScope';
import { authHeaders, isRecord, parseJsonSafe } from '@/lib/apiProxy';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { validateCsrfToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HARVEST_BASE = `${BACKEND_URL}/api/apps/panens`;

const querySchema = z
  .object({
    tanggal: z.string().optional(),
    tanggal_end: z.string().optional(),
    fcba: z.string().optional(),
    afdeling: z.string().optional(),
    status_harvesting: z.string().optional(),
    kemandoran: z.string().optional(),
    nodokumen: z.string().optional(),
    kode_karyawan: z.string().optional(),
    tph: z.string().optional(),
  })
  .passthrough();

export async function POST(req: NextRequest): Promise<NextResponse> {
  // === RATE LIMITING ===
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  try {
    await apiRateLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  // === CSRF VALIDATION ===
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  if (!csrfToken || !validateCsrfToken(req, csrfToken)) {
    return NextResponse.json({ ok: false, error: 'Invalid CSRF token' }, { status: 403 });
  }

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const incoming = await req.formData();
  const upstream = await fetch(HARVEST_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: incoming,
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[API_HARVEST_POST_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Harvest submission failed' },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // === RATE LIMITING ===
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  try {
    await apiRateLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const validated = querySchema.safeParse(rawParams);
  if (!validated.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid query parameters', details: validated.error.format() },
      { status: 400 }
    );
  }

  const sp = new URLSearchParams(req.nextUrl.searchParams.toString());
  applyUserDataScope(req, sp);

  const upstreamUrl = buildFilteredUrl(HARVEST_BASE, sp);

  const upstream = await fetch(upstreamUrl, {
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
    console.error('[API_HARVEST_GET_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch harvest data' },
      { status: upstream.status }
    );
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return NextResponse.json({ ok: true, data: data.data, message: data.message ?? 'OK' });
  }

  return NextResponse.json({ ok: true, data: [], message: 'OK' });
}
