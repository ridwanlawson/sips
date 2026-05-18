import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BACKEND_URL, getTokenFromCookie } from "@/utils/absensiProxy";
import { applyUserDataScope } from "@/utils/requestScope";
import { authHeaders, isRecord, extractMessage, parseJsonSafe } from "@/lib/apiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PENGANGKUTAN_BASE = `${BACKEND_URL}/api/apps/pengangkutans`;

const querySchema = z.object({
  nopengangkutan: z.string().optional(),
  nodokumen: z.string().optional(),
  tanggal: z.string().optional(),
  tanggal_end: z.string().optional(),
  fcba: z.string().optional(),
  afdeling: z.string().optional(),
  kemandoran: z.string().optional(),
  status_pengangkutan: z.string().optional(),
}).passthrough();

const ALLOWED_PARAMS = new Set([
  "nopengangkutan", "nospb", "nodokumen", "tanggal", "tanggal_end",
  "kode_karyawan_kerani", "kode_karyawan_driver",
  "tkbm1", "tkbm2", "tkbm3", "tkbm4", "tkbm5",
  "type_pengangkutan", "kode_kendaraan", "fcba", "pabrik_tujuan",
  "afdeling", "kemandoran", "tph", "fieldcode", "status_pengangkutan", "flag",
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const validated = querySchema.safeParse(rawParams);
  if (!validated.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query parameters", details: validated.error.format() },
      { status: 400 },
    );
  }

  const sp = new URLSearchParams(req.nextUrl.searchParams.toString());
  applyUserDataScope(req, sp);

  const url = new URL(PENGANGKUTAN_BASE);
  for (const [k, v] of sp.entries()) {
    if (ALLOWED_PARAMS.has(k) && v) url.searchParams.append(k, v);
  }

  const upstream = await fetch(url.toString(), {
    headers: authHeaders(token),
    cache: "no-store",
  });

  const { data, parseError } = await parseJsonSafe(upstream);
  if (parseError) {
    return NextResponse.json({ ok: false, error: "Invalid response format" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ ok: false, error: extractMessage(data, "Fetch failed") }, { status: upstream.status });
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return NextResponse.json({ ok: true, data: data.data, message: data.message ?? "OK" });
  }

  return NextResponse.json({ ok: true, data: [], message: "OK" });
}
