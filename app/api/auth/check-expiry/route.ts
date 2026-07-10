import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // No token → no session to check; tell the checker to stand down.
    if (!token) {
      return NextResponse.json({ tokenPresent: false, expired: false, exp: null });
    }

    const payload = token.split('.')[1];
    if (!payload) {
      // Not a standard JWT — can't determine expiry; assume valid.
      return NextResponse.json({ tokenPresent: true, expired: false, exp: null });
    }

    const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '===';
    const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
    const exp = typeof decoded.exp === 'number' ? decoded.exp : null;

    if (exp === null) {
      // JWT exists but no numeric exp claim — can't verify; assume valid.
      return NextResponse.json({ tokenPresent: true, expired: false, exp: null });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    return NextResponse.json({ tokenPresent: true, expired: nowSec >= exp, exp });
  } catch {
    // Parse error — can't verify expiry; assume valid.
    return NextResponse.json({ tokenPresent: true, expired: false, exp: null });
  }
}
