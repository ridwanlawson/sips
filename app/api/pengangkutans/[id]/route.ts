import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, extractMessage, parseJsonSafe } from '@/lib/apiProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PENGANGKUTAN_BASE = `${BACKEND_URL}/api/apps/pengangkutans`;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const upstream = await fetch(`${PENGANGKUTAN_BASE}/${encodeURIComponent(String(id))}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: extractMessage(data, 'Failed to fetch record') },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const incoming = await req.formData();
  const form = new FormData();
  for (const [key, value] of incoming.entries()) {
    if (typeof value === 'string') {
      form.append(key, value);
    } else {
      form.append(key, value, value.name);
    }
  }
  form.append('_method', 'PUT');

  const upstream = await fetch(`${PENGANGKUTAN_BASE}/${encodeURIComponent(String(id))}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: extractMessage(data, 'Failed to update record') },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const incoming = await req.formData();
  const baDeleted = incoming.get('ba_deleted');
  if (!(baDeleted instanceof File)) {
    return NextResponse.json({ ok: false, error: 'BA delete file wajib dilampirkan' }, { status: 400 });
  }

  const form = new FormData();
  form.append('ba_deleted', baDeleted, baDeleted.name);

  const upstream = await fetch(`${PENGANGKUTAN_BASE}/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: extractMessage(data, 'Failed to delete record') },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const incoming = await req.formData();
  const methodOverride = (incoming.get('_method') as string | null) || '';
  if (methodOverride.toUpperCase() !== 'DELETE') {
    return NextResponse.json({ ok: false, error: 'Method not supported' }, { status: 405 });
  }

  const form = new FormData();
  for (const [key, value] of incoming.entries()) {
    if (typeof value === 'string') {
      form.append(key, value);
    } else {
      form.append(key, value, value.name);
    }
  }

  const upstream = await fetch(`${PENGANGKUTAN_BASE}/${encodeURIComponent(String(id))}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: 'Invalid response format' }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: extractMessage(data, 'Failed to delete record') },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}
