import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/utils/absensiProxy";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const userId = cookieStore.get("log_id")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ ok: false, error: "User id missing" }, { status: 400 });
  }

  const url = `${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`;

  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json({ ok: false, error: data?.message || "Profile fetch failed" }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, data });
}
