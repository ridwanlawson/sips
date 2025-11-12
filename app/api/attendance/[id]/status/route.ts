import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "http://dev.skj.my.id:82/api/apps/absensis";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await Promise.resolve(context.params);
  const { id } = params;

  try {
    const body = await req.json();

    // =====================================================
    // AMBIL TOKEN DARI COOKIES (SEPERTI DI SCRIPT CLIENT)
    // =====================================================
    // Silakan sesuaikan nama cookienya kalau beda:
    // misal: "user_Token", "token", "auth_token", dll.
    let rawToken =
      req.cookies.get("user_Token")?.value || // contoh kalau pakai ini
      req.cookies.get("token")?.value ||
      req.cookies.get("auth_token")?.value ||
      req.cookies.get("Authorization")?.value ||
      "";

    if (!rawToken) {
      return NextResponse.json(
        {
          ok: false,
          message: "Token tidak ditemukan di cookies. Pastikan user sudah login.",
        },
        { status: 401 }
      );
    }

    // Kalau cookienya sudah menyimpan "Bearer xxxxxx", kita pakai apa adanya.
    // Kalau cuma "xxxxxx", kita tambahkan "Bearer ".
    if (!rawToken.toLowerCase().startsWith("bearer ")) {
      rawToken = `Bearer ${rawToken}`;
    }

    const res = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: rawToken,
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
