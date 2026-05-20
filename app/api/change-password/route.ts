import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/utils/absensiProxy";

export async function POST(request: Request) {
  try {
    const { current_password, new_password } = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }

    const upstream = await fetch(`${BACKEND_URL}/api/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ current_password, new_password }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // SECURITY: Log original error details server-side but return generic message
      // to client to prevent information leakage (CWE-209).
      console.error("[CHANGE_PASSWORD_ERROR]", { status: upstream.status, data });
      return NextResponse.json(
        { ok: false, error: "Failed to change password" },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, message: data?.message || "Password changed successfully" });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
