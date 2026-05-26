import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, getTokenFromCookie } from '@/utils/absensiProxy';
import { applyUserDataScope } from '@/utils/requestScope';
import { proxyGet, unauthorizedResponse } from '@/lib/apiProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = await getTokenFromCookie();
  if (!token) return unauthorizedResponse();

  const searchParams = new URLSearchParams(req.nextUrl.searchParams.toString());
  applyUserDataScope(req, searchParams);

  const url = `${BACKEND_URL}/api/report/upload-lhm${searchParams.toString() ? `?${searchParams}` : ''}`;
  console.log('Proxying GET request to:', url);
  return proxyGet(url, token);
}
