import { NextResponse } from 'next/server';
import { getTokenFromCookie } from '@/utils/absensiProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getTokenFromCookie();

  if (!token) {
    return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
  }

  return NextResponse.json({ success: true, token });
}
