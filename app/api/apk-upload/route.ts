import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXTERNAL_API_BASE = BACKEND_URL;

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookie();
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const externalUrl = `${EXTERNAL_API_BASE}/api/app/apk`;

    // Forward request body stream langsung ke Laravel
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    console.log('🚀 Proxying upload to Laravel:', externalUrl);
    console.log('   Content-Type:', contentType);

    const response = await fetch(externalUrl, {
      method: 'POST',
      headers,
      body: req.body,
      // @ts-expect-error duplex required for streaming body
      duplex: 'half',
    });

    console.log('📤 Laravel response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      const details = text.length > 1200 ? text.substring(0, 1200) + '...' : text;
      console.error('❌ Laravel error response:', details);
      return NextResponse.json(
        {
          success: false,
          message: `Laravel error (HTTP ${response.status})`,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Laravel success response:', data);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('❌ Proxy crash:', error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Proxy error occurred' }, { status: 500 });
  }
}
