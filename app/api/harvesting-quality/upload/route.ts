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
      console.warn("No token found");
      return NextResponse.json(
        {
          success: false,
          message: "No authentication token found. Please login again.",
          data: [],
        },
        { status: 401 }
      );
    }

    // Ambil query parameters dari request
    const searchParams = new URLSearchParams(req.nextUrl.searchParams.toString());
    applyUserDataScope(req, searchParams);
    const queryString = searchParams.toString();

    const externalUrl = `${EXTERNAL_API_BASE}/api/report/upload-harvesting-quality${queryString ? `?${queryString}` : ""}`;

    console.log("========== HARVESTING QUALITY UPLOAD DEBUG ==========");
    console.log("Proxying to:", externalUrl);
    console.log("Token present:", !!token);
    console.log("Token preview:", token?.substring(0, 20) + "...");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    console.log("Headers:", {
      "Content-Type": headers["Content-Type"],
      "Authorization": "Bearer [TOKEN]",
    });

    const response = await fetch(externalUrl, {
      method: "GET",
      headers,
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      const textData = await response.text();
      console.error("Response text:", textData);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to parse API response: ${textData.substring(0, 200)}`,
          data: [],
        },
        { status: 500 }
      );
    }

    // Jika 404 dan data tidak ditemukan, anggap sebagai kondisi normal (data kosong)
    if (!response.ok) {
      if (response.status === 404 || (data?.message && data.message.includes("Data tidak ditemukan"))) {
        console.log("ℹ️ Data tidak ditemukan (404) - returning empty data");
        return NextResponse.json({
          success: true,
          message: "Data tidak ditemukan dengan parameter yang diberikan",
          data: [],
        });
      }

      console.error("API returned error:");
      console.error("Status:", response.status);
      console.error("Response data:", data);
      return NextResponse.json(
        {
          success: false,
          message: `External API error ${response.status}: ${data?.message || "Unknown error"}`,
          data: [],
        },
        { status: response.status }
      );
    }

    console.log("✓ Success! Data length:", data?.data?.length || 0);
    console.log("================================================");
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Upload harvesting quality proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch harvesting quality data: " + (error instanceof Error ? error.message : String(error)),
        data: [],
      },
      { status: 500 }
    );
  }
}
