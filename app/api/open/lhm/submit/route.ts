import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, parseJsonSafe, unauthorizedResponse } from '@/lib/apiProxy';
import { uploadSubmitSchema, validateInput, sanitizeObject } from '@/lib/inputSanitizer';
import { validateCsrfToken } from '@/lib/csrf';
import { apiRateLimiter } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // === RATE LIMITING ===
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  try {
    await apiRateLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  const token = await getTokenFromCookie();
  if (!token) return unauthorizedResponse();

  // === CSRF VALIDATION ===
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  if (!csrfToken || !validateCsrfToken(req, csrfToken)) {
    return NextResponse.json(
      { success: false, message: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Validate dan sanitize input
    const validation = validateInput(body, uploadSubmitSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // Forward ke backend dengan sanitized data
    const sanitizedData = sanitizeObject(validation.data);
    const response = await fetch(`${BACKEND_URL}/api/uploads/open_lhm_data/mobile`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(sanitizedData),
    });

    const { data, parseError } = await parseJsonSafe(response);
    if (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid response format from upstream' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      // SECURITY: Log original error details server-side but return generic message
      // to client to prevent information leakage (CWE-209).
      console.error('[API_OPEN_LHM_SUBMIT_POST_ERROR]', { status: response.status, data });
      return NextResponse.json(
        { success: false, message: 'Submit failed' },
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
