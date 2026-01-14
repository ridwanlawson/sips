import { NextRequest, NextResponse } from "next/server";
import { getTokenFromCookie } from "@/utils/absensiProxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXTERNAL_API_BASE = "http://dev.skj.my.id:82";

export async function POST(req: NextRequest) {
  try {
    console.log("========== ATTENDANCE SUBMIT START ==========");
    console.log("Method:", req.method);
    console.log("URL:", req.url);

    const token = await getTokenFromCookie();
    console.log("Token status:", token ? "Found" : "Not found");

    if (!token) {
      console.warn("No token found");
      return NextResponse.json(
        {
          success: false,
          message: "No authentication token found. Please login again.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("Request body keys:", Object.keys(body));
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format. Expected data array.",
        },
        { status: 400 }
      );
    }

    console.log("========== ATTENDANCE SUBMIT DEBUG ==========");
    console.log("Total records to submit:", data.length);
    console.log("First record sample:", data[0] ? JSON.stringify(data[0], null, 2).substring(0, 500) : "No records");

    // Submit ke external API
    const externalUrl = `${EXTERNAL_API_BASE}/api/uploads/attendance`;

    console.log("Proxying POST to:", externalUrl);
    console.log("Token present:", !!token);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Simply forward the data array directly to external API
    const requestBody = {
      data: data, // Direct data array
    };

    console.log("Request body to external API:", JSON.stringify(requestBody, null, 2).substring(0, 500));

    // Send all records to external API
    const response = await fetch(externalUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      const textData = await response.text();
      console.error("Response text:", textData);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to parse API response: ${textData.substring(0, 200)}`,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("API returned error:");
      console.error("Status:", response.status);
      console.error("Response data:", responseData);
      return NextResponse.json(
        {
          success: false,
          message: `External API error ${response.status}: ${responseData?.message || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    console.log("✓ Success! Response data:", responseData);
    console.log("============================================");
    return NextResponse.json({
      success: true,
      message: "Attendance records submitted successfully to SIPS",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Attendance submit proxy error:", error);
    console.error("Error type:", error instanceof Error ? error.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error:", JSON.stringify(error, null, 2));

    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: `Server Error: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
