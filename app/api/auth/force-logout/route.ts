import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CookieName } from "@/lib/constants";

/**
 * Force logout endpoint — clears all cookies regardless of token validity.
 * Used when token is invalid/expired and normal logout fails.
 */
const COOKIES_TO_DELETE = [
  CookieName.AUTH_TOKEN,
  CookieName.LOG_ID,
  CookieName.USER_FULL_NAME,
  CookieName.USER_LEVEL,
  CookieName.USER_FCBA,
  CookieName.USER_AFDELING,
  CookieName.USER_GANG,
  CookieName.USER_KODE,
  CookieName.USER_POSITION,
  CookieName.USER_PHOTO,
  // Legacy / inconsistent variants
  "user_Section", "user_SECTION", "user_section", "user_afdeling",
  "user_FCBA", "user_fcba", "user_LEVEL", "user_level",
  "user_GANG", "user_gang",
  // Options
  CookieName.OPT_FCBA,
  CookieName.OPT_SECTION,
  CookieName.OPT_GANG,
  CookieName.OPT_TRIPLETS,
];

export async function POST() {
  try {
    const cookieStore = await cookies();

    for (const name of COOKIES_TO_DELETE) {
      cookieStore.delete(name);
    }

    return NextResponse.json({ ok: true, message: "All cookies cleared successfully" });
  } catch {
    // Even on error, return success — we want to logout anyway
    return NextResponse.json({ ok: true, message: "Logout completed with warnings" });
  }
}
