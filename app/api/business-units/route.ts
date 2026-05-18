import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/utils/absensiProxy";
import { authHeaders } from "@/lib/apiProxy";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(`${BACKEND_URL}/api/master/sips-businessunit`);
  for (const [key, value] of request.nextUrl.searchParams) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { headers: authHeaders(token) });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { ok: false, error: `Upstream error: ${response.status} - ${errorText}` },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({ ok: true, data });
}
