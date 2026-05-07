import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookie } from "@/utils/absensiProxy";
import { applyUserDataScope } from "@/utils/requestScope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXTERNAL_API_BASE = "http://dev.skj.my.id:82";

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenFromCookie();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No authentication token found. Please login again.", data: [] },
        { status: 401 },
      );
    }

    const searchParams = new URLSearchParams(req.nextUrl.searchParams.toString());
    applyUserDataScope(req, searchParams);
    const queryString = searchParams.toString();

    const externalUrl = `${EXTERNAL_API_BASE}/api/report/upload-lhm${queryString ? `?${queryString}` : ""}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(externalUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid response format from upstream", data: [] },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message?: string }).message
          : "Fetch failed";
      return NextResponse.json(
        { success: false, message, data: [] },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, message: msg, data: [] },
      { status: 500 },
    );
  }
}
