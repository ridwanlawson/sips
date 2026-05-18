import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/utils/absensiProxy";
import { authHeaders, extractDataArray } from "@/lib/apiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TphRow = {
  id?: string;
  notph?: string;
  fieldcode?: string;
  ancakno?: string;
  typetph?: string;
  status?: string;
  location?: string;
  fcba?: string;
  division?: string;
  ha?: string;
  tahuntanam?: string;
  bjr?: string;
  [key: string]: unknown;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const fcba = searchParams.get("fcba");
  if (!fcba) {
    return NextResponse.json({ ok: false, error: "fcba is required" }, { status: 400 });
  }

  const upstreamParams = new URLSearchParams({ fcba });
  for (const key of ["fieldcode", "afdeling", "ancakno", "notph"]) {
    const v = searchParams.get(key);
    if (v) upstreamParams.append(key, v);
  }

  const upstream = await fetch(`${BACKEND_URL}/api/apps/tphs?${upstreamParams}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!upstream.ok) {
    let errorMessage = `Upstream returned ${upstream.status} ${upstream.statusText}`;
    try {
      if (upstream.headers.get("content-type")?.includes("application/json")) {
        const raw = await upstream.json();
        errorMessage = raw?.message || errorMessage;
      }
    } catch { /* keep default */ }
    return NextResponse.json({ ok: false, error: errorMessage }, { status: upstream.status });
  }

  const raw = await upstream.json();
  const rows = extractDataArray(raw) as TphRow[];

  return NextResponse.json(
    { ok: true, data: rows },
    { headers: { "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=1200" } },
  );
}
