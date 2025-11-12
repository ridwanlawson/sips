import { NextRequest, NextResponse } from "next/server";
import {
  ABSENSI_BASE,
  buildFilteredUrl,
  getTokenFromCookie,
  safeJson,
} from "@/utils/absensiProxy";

export const dynamic = "force-dynamic"; // no cache
export const runtime = "nodejs";

// --- type guards ---
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isSuccessArrayData(
  v: unknown
): v is { success?: boolean; message?: string; data: unknown[] } {
  return isRecord(v) && Array.isArray(v.data);
}

export async function GET(req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
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
  //
  // 1. ADM  -> tidak dipaksa fcba/afdeling (bisa lihat semua)
  // 2. MGR  -> paksa fcba = homeFcba (afdeling boleh pilih bebas)
  // 3. AST  -> paksa fcba = homeFcba dan afdeling = homeAfdeling
  //
  if (level === "MGR") {
    if (homeFcba) {
      sp.set("fcba", homeFcba);
    }
    // afdeling TIDAK dipaksa: boleh filter afdeling lain dalam FCBA yang sama
  } else if (level === "AST") {
    if (homeFcba) {
      sp.set("fcba", homeFcba);
    }
    if (homeAfdeling) {
      // API dokumentasi menggunakan nama parameter "afdeling"
      sp.set("afdeling", homeAfdeling);
    }
  }
  // level ADM: tidak menyentuh fcba / afdeling sama sekali → bisa lihat semua

  // Build URL final ke API absensi upstream
  const upstreamUrl = buildFilteredUrl(ABSENSI_BASE, sp);

  const upstream = await fetch(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      // "Content-Type": "application/json", // GET tidak perlu
    },
    cache: "no-store",
  });

  const text = await upstream.text();

  // parsing aman
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid response format", debug_response: text },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const message =
      isRecord(data) && typeof data.message === "string"
        ? data.message
        : "Fetch failed";
    return NextResponse.json(
      { ok: false, error: message, debug_response: data },
      { status: upstream.status }
    );
  }

  // API contohmu mengirim { success, message, data:[...] }
  if (isSuccessArrayData(data)) {
    return NextResponse.json({
      ok: true,
      data: data.data,
      message: data.message,
    });
  }

  // fallback aman untuk bentuk { data: ... , message?: string }
  if (isRecord(data)) {
    const arr = Array.isArray(data.data) ? data.data : [];
    const message = typeof data.message === "string" ? data.message : "OK";
    return NextResponse.json({ ok: true, data: arr, message });
  }

  // jika respon bukan object
  return NextResponse.json({ ok: true, data: [], message: "OK" });
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
