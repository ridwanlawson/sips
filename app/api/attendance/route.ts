import { NextRequest, NextResponse } from "next/server";
import {
  ABSENSI_BASE,
  buildFilteredUrl,
  getTokenFromCookie,
  safeJson,
} from "@/utils/absensiProxy";
import { attendanceFilterSchema, attendanceApiResponseSchema } from "@/lib/validations/attendance";

export const dynamic = "force-dynamic"; // no cache
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  // Parse searchParams from URL
  const searchParams = Object.fromEntries(req.nextUrl.searchParams);
  
  // Validate search params with Zod
  const validatedFilters = attendanceFilterSchema.safeParse(searchParams);
  if (!validatedFilters.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid search parameters", details: validatedFilters.error.flatten() },
      { status: 400 }
    );
  }

  // Clone searchParams supaya bisa dimodifikasi
  const sp = new URLSearchParams(req.nextUrl.searchParams.toString());

  // ==== BACA DATA DARI COOKIE UNTUK LEVEL, FCBA, AFDELING ====
  const cookies = req.cookies;

  const rawLevel =
    cookies.get("user_Level")?.value ||
    cookies.get("user_LEVEL")?.value ||
    cookies.get("user_level")?.value ||
    "";
  const level = rawLevel.toUpperCase() as "ADM" | "MGR" | "AST" | string;

  const homeFcba =
    cookies.get("user_Fcba")?.value ||
    cookies.get("user_FCBA")?.value ||
    cookies.get("user_fcba")?.value ||
    "";

  const homeAfdeling =
    cookies.get("user_Section")?.value ||
    cookies.get("user_SECTION")?.value ||
    cookies.get("user_section")?.value ||
    cookies.get("user_Afdeling")?.value ||
    cookies.get("user_afdeling")?.value ||
    "";

  // ==== ATURAN SCOPING DATA BERDASARKAN LEVEL ====
  if (level === "MGR") {
    if (homeFcba) {
      sp.set("fcba", homeFcba);
    }
  } else if (level === "AST") {
    if (homeFcba) {
      sp.set("fcba", homeFcba);
    }
    if (homeAfdeling) {
      sp.set("afdeling", homeAfdeling);
    }
  }

  // Build URL final ke API absensi upstream
  const upstreamUrl = buildFilteredUrl(ABSENSI_BASE, sp);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();
    let rawData: unknown = null;
    try {
      rawData = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid response format from upstream" },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      const message = (rawData && typeof rawData === 'object' && 'message' in rawData) 
        ? String(rawData.message) 
        : "Fetch failed";
      return NextResponse.json(
        { ok: false, error: message },
        { status: upstream.status }
      );
    }

    // Normalize and validate response data
    let dataList: unknown[] = [];
    if (rawData && typeof rawData === 'object') {
      if ('data' in rawData && Array.isArray(rawData.data)) {
        dataList = rawData.data;
      } else if (Array.isArray(rawData)) {
        dataList = rawData;
      }
    }

    const response = {
      ok: true,
      data: dataList,
      message: (rawData && typeof rawData === 'object' && 'message' in rawData) ? String(rawData.message) : "OK"
    };

    // Validate outgoing response
    const validatedResponse = attendanceApiResponseSchema.safeParse(response);
    if (!validatedResponse.success) {
      return NextResponse.json(
        { ok: false, error: "Internal data validation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(validatedResponse.data);
  } catch (error) {
    console.error("[API_ATTENDANCE_GET]", error);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const form = await req.formData(); // biarkan fetch set boundary multipart
  const upstream = await fetch(ABSENSI_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: form,
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: data?.message || "Create failed" },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}
