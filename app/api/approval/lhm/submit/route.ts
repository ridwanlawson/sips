import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { authHeaders, parseJsonSafe, extractMessage, unauthorizedResponse } from '@/lib/apiProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = await getTokenFromCookie();
  if (!token) return unauthorizedResponse();

  const body = await req.json();

  const response = await fetch(`${BACKEND_URL}/api/uploads/lhm_data/mobile`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  const { data, parseError } = await parseJsonSafe(response);

  if (parseError) {
    return NextResponse.json(
      { success: false, message: 'Invalid response format from upstream' },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        message: extractMessage(data, 'Submit failed'),
        error: (data as Record<string, unknown>)?.error,
      },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
