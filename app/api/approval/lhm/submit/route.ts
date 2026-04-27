import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookie } from "@/utils/absensiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXTERNAL_API_BASE = "http://dev.skj.my.id:82";

export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromCookie();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No authentication token found. Please login again." },
        { status: 401 },
      );
    }

    const body = await req.json();

    const externalUrl = `${EXTERNAL_API_BASE}/api/uploads/lhm_data/mobile`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(externalUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid response format from upstream" },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : "Submit failed";
      const error =
        typeof data === "object" && data !== null && "error" in data
          ? (data as { error?: string }).error
          : undefined;
      return NextResponse.json(
        { success: false, message, error },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 },
    );
  }
}
