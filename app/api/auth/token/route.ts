import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTokenFromCookie } from "@/utils/absensiProxy";
import { BACKEND_URL } from "@/utils/backendConfig";
import { UserLevel } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Endpoint to retrieve the auth token for APK upload.
 * Restricted to administrators only via server-side verification.
 */
export async function GET() {
  const token = await getTokenFromCookie();
  const cookieStore = await cookies();
  const userId = cookieStore.get("log_id")?.value;

  if (!token || !userId) {
    return NextResponse.json(
      { success: false, message: "Unauthenticated" },
      { status: 401 }
    );
  }

  // SECURITY: Server-side Authorization Check (CWE-285)
  // We fetch the profile from the backend to verify the user's role.
  // This prevents information leakage of the raw JWT token to unauthorized users.
  try {
    const profileRes = await fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to verify authorization" },
        { status: profileRes.status }
      );
    }

    const profileData = await profileRes.json();
    const level = profileData?.data?.level?.toUpperCase();

    // Only ADM (ADMIN) is allowed to access the raw token for APK upload
    if (level !== UserLevel.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    // SECURITY: Log detailed error server-side, return generic message
    console.error("[AUTH_TOKEN_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
