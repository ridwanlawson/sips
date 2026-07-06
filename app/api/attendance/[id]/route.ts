import { NextRequest, NextResponse } from 'next/server';
import { ABSENSI_BASE, getTokenFromCookie } from '@/utils/absensiProxy';
import { parseJsonSafe } from '@/lib/apiProxy';
import { validateSecurity } from '@/lib/security';
import { apiRateLimiter } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // === RATE LIMITING ===
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  try {
    await apiRateLimiter.consume(ip);
  } catch {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });

  const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[API_ATTENDANCE_ID_GET_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch attendance record' },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  // Ambil form dari client
  const incoming = await req.formData();

  // Salin field ke FormData baru + override method
  const form = new FormData();
  for (const [k, v] of incoming.entries()) {
    if (typeof v === 'string') {
      form.append(k, v); // string oke langsung
    } else {
      // v adalah File
      form.append(k, v, v.name); // sertakan filename agar aman pada sebagian backend
    }
  }
  form.append('_method', 'PUT');

  // Kirim ke upstream sebagai POST (method override)
  const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      // Penting: JANGAN set 'Content-Type' manual; biarkan fetch mengatur boundary FormData
    },
    body: form,
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[API_ATTENDANCE_ID_PUT_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Failed to update attendance record' },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });

  const incoming = await req.formData();
  const baDeleted = incoming.get('ba_deleted');
  if (!(baDeleted instanceof File)) {
    return NextResponse.json({ ok: false, error: 'BA delete PDF wajib diisi' }, { status: 400 });
  }

  const form = new FormData();
  form.append('ba_deleted', baDeleted, baDeleted.name);

  const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error('[API_ATTENDANCE_ID_DELETE_ERROR]', { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: 'Failed to delete attendance record' },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

// Accept POST with _method override so clients can upload files (Laravel expects multipart POST)
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });

  const incoming = await req.formData();
  const methodOverride = (incoming.get('_method') as string | null) || '';

  if (methodOverride.toUpperCase() === 'DELETE') {
    const baDeleted = incoming.get('ba_deleted');
    if (!(baDeleted instanceof File)) {
      return NextResponse.json({ ok: false, error: 'BA delete PDF wajib diisi' }, { status: 400 });
    }

    // Rebuild FormData to ensure files have filenames when proxied
    const form = new FormData();
    for (const [k, v] of incoming.entries()) {
      if (typeof v === 'string') {
        form.append(k, v);
      } else {
        form.append(k, v, v.name);
      }
    }

    const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: form,
    });

    const { data, parseError } = await parseJsonSafe(upstream);
    if (parseError) {
      return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
    }
    if (!upstream.ok) {
      console.error('[API_ATTENDANCE_ID_POST_DELETE_ERROR]', { status: upstream.status, data });
      return NextResponse.json(
        { ok: false, error: 'Failed to delete attendance record' },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true, data });
  }

  return NextResponse.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
}
