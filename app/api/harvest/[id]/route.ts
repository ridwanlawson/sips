import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookie, safeJson } from "@/utils/absensiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HARVEST_BASE = "http://dev.skj.my.id:82/api/apps/panens";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;
  const token = await getTokenFromCookie();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const upstream = await fetch(`${HARVEST_BASE}/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    return NextResponse.json({ ok: false, error: data?.message || "Fetch failed" }, { status: upstream.status });
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
  const upstream = await fetch(`${HARVEST_BASE}/${encodeURIComponent(String(id))}`, {
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
      { ok: false, error: data?.message || "Update failed", debug: data },
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

  const upstream = await fetch(`${HARVEST_BASE}/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  const data = await safeJson(upstream);
  if (!upstream.ok) {
    return NextResponse.json({ ok: false, error: data?.message || "Delete failed" }, { status: upstream.status });
  }
  return NextResponse.json({ ok: true, data });
}
