import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, parseJsonSafe, unauthorizedResponse } from '@/lib/apiProxy';
import { harvestSubmitSchema, validateInput, sanitizeObject } from '@/lib/inputSanitizer';
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
    return NextResponse.json(
      { success: false, message: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Validate dan sanitize input (gunakan harvest schema)
    const validation = validateInput(body, harvestSubmitSchema);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // Forward ke backend dengan sanitized data
    const sanitizedData = sanitizeObject(validation.data);
    const response = await fetch(`${BACKEND_URL}/api/uploads/harvestingquality`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(sanitizedData),
    });

    const { data, parseError } = await parseJsonSafe(response);
    if (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid response format' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to submit harvesting quality' },
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
