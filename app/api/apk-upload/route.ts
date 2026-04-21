import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookie } from "@/utils/absensiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// WAJIB: matikan bodyParser agar body tetap stream (multipart boundary aman)
export const config = {
  api: {
    bodyParser: false,
  },
};

const EXTERNAL_API_BASE = "http://dev.skj.my.id:82";

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookie();
    if (!token) {
      return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
    }

    const externalUrl = `${EXTERNAL_API_BASE}/api/app/apk`;

    // Buat headers baru, copy hampir semua dari client (termasuk Content-Type + boundary)
    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");

    // Hapus header yang bisa bikin masalah saat proxy
    headers.delete("host");
    headers.delete("content-length"); // biarkan fetch hitung ulang
    headers.delete("connection");
    headers.delete("transfer-encoding");

    console.log("Proxying to Laravel with Content-Type:", headers.get("content-type"));

    // Forward stream body langsung dari client ke Laravel
    const proxyRequest = new Request(externalUrl, {
      method: "POST",
      headers,
      body: req.body,      // ← stream mentah, boundary tetap utuh
      duplex: "half",    // wajib untuk fetch streaming body di Next.js
    } as RequestInit & { duplex?: "half" });

    const response = await fetch(proxyRequest);
    console.log("Laravel response status:", response.status);

    // Tangani kalau Laravel return error (HTML atau JSON)
    if (!response.ok) {
      const text = await response.text();
      const details = text.length > 1200 ? text.substring(0, 1200) + "..." : text;
      console.error("Laravel error response:", details);
      return NextResponse.json(
        {
          success: false,
          message: "Laravel error",
          status: response.status,
          details,
        },
        { status: response.status }
      );
    }

    // Kalau sukses, forward JSON
    const data = await response.json();
    return NextResponse.json(data);

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Proxy crash:", error.message, error.stack);
    return NextResponse.json(
      { success: false, message: "Proxy error: " + error.message },
      { status: 500 }
    );
  }
}