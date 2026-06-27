import { NextRequest, NextResponse } from 'next/server';
import { ABSENSI_BASE, getTokenFromCookie } from '@/utils/absensiProxy';
import { validateSecurity } from '@/lib/security';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // === SECURITY VALIDATION (CSRF & RATE LIMITING) ===
  const securityError = await validateSecurity(req);
  if (securityError) return securityError;

  const params = await Promise.resolve(context.params);
  const { id } = params;

  try {
    const token = await getTokenFromCookie();

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Token tidak ditemukan di cookies. Pastikan user sudah login.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${ABSENSI_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // SECURITY: Log original error details server-side but return generic message
      // to client to prevent information leakage (CWE-209).
      console.error('[API_ATTENDANCE_STATUS_PATCH_ERROR]', { status: res.status, data });
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          message: 'Gagal update status absensi ke server eksternal',
        },
        { status: res.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: res.status,
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    // SECURITY: Log detailed crash info server-side but return generic message.
    console.error('Error PATCH /api/attendance/[id]/status:', err);
    return NextResponse.json(
      {
        ok: false,
        message: 'Terjadi kesalahan pada server API route',
      },
      { status: 500 }
    );
  }
}
