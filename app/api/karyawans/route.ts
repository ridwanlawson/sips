// app/api/karyawans/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Minimal typing for karyawan rows returned by upstream API.
interface KaryawanRow {
  fcba?: string | number | null;
  sectionname?: string | null;
  gangcode?: string | null;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
   const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Forward query parameters to upstream for server-side filtering
   const searchParams = req.nextUrl.searchParams;
   const upstreamParams = new URLSearchParams();
    
    // Forward all relevant filter parameters
    ['fcba', 'afdeling', 'sectionname', 'gangcode', 'noancak', 'fctype', 'fccompanycode'].forEach(param => {
     const value = searchParams.get(param);
      if (value) {
        upstreamParams.append(param, value);
      }
    });

   const queryString = upstreamParams.toString();
   const upstreamUrl = queryString 
      ? `http://dev.skj.my.id:82/api/apps/karyawans?${queryString}`
      : 'http://dev.skj.my.id:82/api/apps/karyawans';

   const upstream = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    // Check if response is OK before attempting to parse
    if (!upstream.ok) {
     const contentType = upstream.headers.get('content-type') || '';
      let errorMessage = 'Upstream error';
      
      try {
        // Try to parse as JSON first
        if (contentType.includes('application/json')) {
         const raw = await upstream.json();
          errorMessage = raw?.message || errorMessage;
        } else {
          // If not JSON, try to get text (might be HTML error page)
         const text = await upstream.text();
         console.error('[KARYAWANS] Upstream returned non-JSON response:', text.substring(0, 200));
          errorMessage = `Upstream returned ${upstream.status} ${upstream.statusText}`;
        }
      } catch {
        // If parsing fails, use generic error
        errorMessage = `Upstream returned ${upstream.status} ${upstream.statusText}`;
      }
      
      return NextResponse.json({ ok: false, error: errorMessage }, { status: upstream.status });
    }

   const raw = await upstream.json();

    // Normalisasi: pastikan array ada di raw.data atau raw
    const rows: KaryawanRow[] = Array.isArray(raw?.data) ? (raw.data as KaryawanRow[]) : Array.isArray(raw) ? (raw as KaryawanRow[]) : [];

    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
   console.error('[KARYAWANS]', e);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
