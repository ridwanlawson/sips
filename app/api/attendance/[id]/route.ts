import { NextRequest, NextResponse } from "next/server";
import { ABSENSI_BASE, getTokenFromCookie, safeJson } from "@/utils/absensiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error("[API_ATTENDANCE_ID_GET_ERROR]", { status: upstream.status, data });
    return NextResponse.json({ ok: false, error: "Failed to fetch attendance record" }, { status: upstream.status });
  }
  return NextResponse.json({ ok: true, data });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  // Ambil form dari client
  const incoming = await req.formData();

  // Salin field ke FormData baru + override method
  const form = new FormData();
  for (const [k, v] of incoming.entries()) {
    if (typeof v === "string") {
      form.append(k, v); // string oke langsung
    } else {
      // v adalah File
      form.append(k, v, v.name); // sertakan filename agar aman pada sebagian backend
    }
  }
  form.append("_method", "PUT");

  // Kirim ke upstream sebagai POST (method override)
  const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      // Penting: JANGAN set 'Content-Type' manual; biarkan fetch mengatur boundary FormData
    },
    body: form,
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error("[API_ATTENDANCE_ID_PUT_ERROR]", { status: upstream.status, data });
    return NextResponse.json(
      { ok: false, error: "Failed to update attendance record" },
      { status: upstream.status }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const upstream = await fetch(`${ABSENSI_BASE}/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    // SECURITY: Log original error details server-side but return generic message
    // to client to prevent information leakage (CWE-209).
    console.error("[API_ATTENDANCE_ID_DELETE_ERROR]", { status: upstream.status, data });
    return NextResponse.json({ ok: false, error: "Failed to delete attendance record" }, { status: upstream.status });
  }
  return NextResponse.json({ ok: true, data });
}
