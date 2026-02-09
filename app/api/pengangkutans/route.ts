import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTokenFromCookie } from "@/utils/absensiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PENGANGKUTAN_BASE = "http://dev.skj.my.id:82/api/apps/pengangkutans";

const querySchema = z.object({
  nopengangkutan: z.string().optional(),
  nodokumen: z.string().optional(),
  tanggal: z.string().optional(),
  tanggal_end: z.string().optional(),
  fcba: z.string().optional(),
  afdeling: z.string().optional(),
  status_pengangkutan: z.string().optional(),
}).passthrough();

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSuccessArrayData(v: unknown): v is { success?: boolean; message?: string; data: unknown[] } {
  return isRecord(v) && Array.isArray((v as Record<string, unknown>).data);
}

export async function GET(req: NextRequest) {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const validated = querySchema.safeParse(rawParams);

  if (!validated.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameters", details: validated.error.format() },
      { status: 400 }
    );
  }

  const sp = new URLSearchParams(req.nextUrl.searchParams.toString());

  // Read cookies for scoping
  const cookies = req.cookies;
  const rawLevel =
    cookies.get("user_Level")?.value || cookies.get("user_LEVEL")?.value || cookies.get("user_level")?.value || "";
  const level = String(rawLevel).toUpperCase();

  const homeFcba =
    cookies.get("user_Fcba")?.value || cookies.get("user_FCBA")?.value || cookies.get("user_fcba")?.value || "";

  const homeAfdeling =
    cookies.get("user_Section")?.value || cookies.get("user_SECTION")?.value || cookies.get("user_section")?.value || cookies.get("user_Afdeling")?.value || cookies.get("user_afdeling")?.value || "";

  if (level === "MGR") {
    if (homeFcba) sp.set("fcba", homeFcba);
  } else if (level === "AST") {
    if (homeFcba) sp.set("fcba", homeFcba);
    if (homeAfdeling) sp.set("afdeling", homeAfdeling);
  }

  // Allowed params for pengangkutan
  const allowed = new Set([
    "nopengangkutan",
    "nospb",
    "nodokumen",
    "tanggal",
    "tanggal_end",
    "kode_karyawan_kerani",
    "kode_karyawan_driver",
    "tkbm1",
    "tkbm2",
    "tkbm3",
    "tkbm4",
    "tkbm5",
    "type_pengangkutan",
    "kode_kendaraan",
    "fcba",
    "pabrik_tujuan",
    "afdeling",
    "tph",
    "fieldcode",
    "status_pengangkutan",
    "flag",
  ]);

  const url = new URL(PENGANGKUTAN_BASE);
  for (const [k, v] of sp.entries()) {
    if (allowed.has(k) && v) url.searchParams.append(k, v);
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid response format" }, { status: 502 });
    }

    if (!upstream.ok) {
      const message = isRecord(data) && typeof data.message === "string" ? data.message : "Fetch failed";
      return NextResponse.json({ ok: false, error: message }, { status: upstream.status });
    }

    if (isSuccessArrayData(data)) {
      return NextResponse.json({ ok: true, data: data.data, message: data.message });
    }

    if (isRecord(data)) {
      const record = data as Record<string, unknown>;
      const arr = Array.isArray(record.data) ? (record.data as unknown[]) : [];
      const message = typeof record.message === "string" ? record.message : "OK";
      return NextResponse.json({ ok: true, data: arr, message });
    }

    return NextResponse.json({ ok: true, data: [], message: "OK" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
