import { NextRequest, NextResponse } from "next/server";
import { ABSENSI_BASE, getTokenFromCookie } from "@/utils/absensiProxy";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await Promise.resolve(context.params);
  const { id } = params;

  try {
    const body = await req.json();

    const token = await getTokenFromCookie();

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message: "Token tidak ditemukan di cookies. Pastikan user sudah login.",
        },
        { status: 401 }
      );
    }

    const res = await fetch(`${ABSENSI_BASE}/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          message: "Gagal update status absensi ke server eksternal",
          detail: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: res.status,
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error PATCH /api/attendance/[id]/status:", err);
    return NextResponse.json(
      {
        ok: false,
        message: "Terjadi kesalahan pada server API route",
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
