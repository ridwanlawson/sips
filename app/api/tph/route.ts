import { NextRequest, NextResponse } from "next/server";

// TPH API Route
// This route proxies TPH data from the upstream API
// Query params: fcba, fieldcode

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Type for TPH data based on actual API response
type TphRow = {
  id?: string;
  notph?: string;
  fieldcode?: string;
  ancakno?: string;
  typetph?: string;
  status?: string;
  location?: string;
  fcba?: string;
  division?: string; // afdeling
  ha?: string;
  tahuntanam?: string;
  bjr?: string;
  [key: string]: unknown;
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = req.nextUrl;
    const fcba = searchParams.get("fcba");
    const fieldcode = searchParams.get("fieldcode");
    const afdeling = searchParams.get("afdeling");
    const ancakno = searchParams.get("ancakno");
    const notph = searchParams.get("notph");

    if (!fcba) {
      return NextResponse.json(
        { ok: false, error: "fcba is required" },
        { status: 400 }
      );
    }

    // Build upstream URL with query params
    const upstreamParams = new URLSearchParams();
    upstreamParams.append("fcba", fcba);
    if (fieldcode) upstreamParams.append("fieldcode", fieldcode);
    if (afdeling) upstreamParams.append("afdeling", afdeling);
    if (ancakno) upstreamParams.append("ancakno", ancakno);
    if (notph) upstreamParams.append("notph", notph);

    const upstreamUrl = `http://dev.skj.my.id:82/api/apps/tphs?${upstreamParams.toString()}`;

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const contentType = upstream.headers.get("content-type") || "";
      let errorMessage = "Upstream error";

      try {
        if (contentType.includes("application/json")) {
          const raw = await upstream.json();
          errorMessage = raw?.message || errorMessage;
        } else {
          const text = await upstream.text();
          console.error("[TPH] Upstream returned non-JSON response:", text.substring(0, 200));
          errorMessage = `Upstream returned ${upstream.status} ${upstream.statusText}`;
        }
      } catch {
        errorMessage = `Upstream returned ${upstream.status} ${upstream.statusText}`;
      }

      return NextResponse.json(
        { ok: false, error: errorMessage },
        { status: upstream.status }
      );
    }

    const raw = await upstream.json();

    // Normalize: ensure array exists in raw.data or raw
    const rows: TphRow[] = Array.isArray(raw?.data)
      ? (raw.data as TphRow[])
      : Array.isArray(raw)
        ? (raw as TphRow[])
        : [];

    // Cache response for 10 minutes (600 seconds) to help poor network conditions
    return NextResponse.json(
      { ok: true, data: rows },
      {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (e) {
    console.error("[TPH]", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
