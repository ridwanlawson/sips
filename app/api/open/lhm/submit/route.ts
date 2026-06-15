import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, parseJsonSafe, unauthorizedResponse } from '@/lib/apiProxy';
import { lhmSubmitSchema, validateInput } from '@/lib/inputSanitizer';
import { validateCsrfToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = await getTokenFromCookie();
  if (!token) return unauthorizedResponse();

  // === CSRF VALIDATION ===
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  if (!csrfToken || !validateCsrfToken(req, csrfToken)) {
    return NextResponse.json({ success: false, message: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Validate dan sanitize input
    const validation = validateInput(body, lhmSubmitSchema);
    if (!validation.success) {
      console.error('[API_OPEN_LHM_SUBMIT_VALIDATION_ERROR]', {
        validationError: validation.error,
        body: JSON.stringify(body),
      });
      return NextResponse.json(
        {
          success: false,
          message: validation.error,
          // debug: kembalikan detail isu validasi
          issues: validation.issues || [],
        },
        { status: 400 }
      );
    }

    // Forward ke backend
    // Hanya ID dan ROWDATA yang dikirim, tanpa sanitasi karena ROWDATA
    // bisa berisi serialized data yang rusak jika kena sanitizeHtml
    const response = await fetch(`${BACKEND_URL}/api/uploads/open_lhm_data/mobile`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(validation.data),
    });

    const { data, parseError } = await parseJsonSafe(response);
    if (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid response format from upstream' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error('[API_OPEN_LHM_SUBMIT_POST_ERROR]', { status: response.status, data });
      // Forward actual error from backend for debugging
      const upstreamMsg =
        data && typeof data === 'object'
          ? (data as Record<string, unknown>).message || (data as Record<string, unknown>).error
          : null;
      return NextResponse.json(
        {
          success: false,
          message: upstreamMsg || 'Submit failed',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request format' },
      { status: 400 }
    );
  }
}
