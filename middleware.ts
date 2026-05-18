import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserLevel } from "@/lib/constants";

const PUBLIC_PATHS = new Set<string>(["/", "/login", "/register", "/forgot-password"]);

const UPLOAD_PATHS = ["/attendance/upload", "/harvest/upload", "/harvesting-quality/upload"];

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Initialize response
  const response = NextResponse.next();

  // Set default locale if not present
  if (!request.cookies.has("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", "en");
  }

  // Skip untuk file statis & _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|svg|css|js|ico|txt)$/)
  ) {
    return response;
  }

  // Skip untuk API auth routes
  if (pathname.startsWith("/api/auth")) {
    return response;
  }

  const token = request.cookies.get("auth_token")?.value;

  // Tidak ada token & route privat -> lempar ke /login
  if (!isPublic && !token) {
    const url = new URL("/", origin);
    url.searchParams.set("redirect", pathname);
    const redirectRes = NextResponse.redirect(url);
    if (!request.cookies.has("NEXT_LOCALE")) {
      redirectRes.cookies.set("NEXT_LOCALE", "en");
    }
    return redirectRes;
  }

  // Sudah login & sedang di halaman public -> lempar ke dashboard
  if (isPublic && token) {
    const redirectRes = NextResponse.redirect(new URL("/dashboard", origin));
    if (!request.cookies.has("NEXT_LOCALE")) {
      redirectRes.cookies.set("NEXT_LOCALE", "en");
    }
    return redirectRes;
  }

  // Server-side role-based access control
  const levelRaw =
    request.cookies.get("user_Level")?.value ||
    request.cookies.get("user_level")?.value ||
    request.cookies.get("user_LEVEL")?.value ||
    "";
  const level = levelRaw.toUpperCase();

  const redirectForbidden = () => {
    const redirectRes = NextResponse.redirect(new URL("/dashboard", origin));
    if (!request.cookies.has("NEXT_LOCALE")) {
      redirectRes.cookies.set("NEXT_LOCALE", "en");
    }
    return redirectRes;
  };

  // Restrict access to attendance approval page to ADM and MGR only
  if (pathname.startsWith("/attendance/approval")) {
    if (level !== UserLevel.ADMIN && level !== UserLevel.MANAGER) {
      return redirectForbidden();
    }
  }

  // Restrict access to upload pages to ADM and MGR only
  if (UPLOAD_PATHS.some((p) => pathname.startsWith(p))) {
    if (level !== UserLevel.ADMIN && level !== UserLevel.MANAGER) {
      return redirectForbidden();
    }
  }

  // Restrict access to APK upload page to ADM only
  if (pathname.startsWith("/apk-upload")) {
    if (level !== UserLevel.ADMIN) {
      return redirectForbidden();
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api/health).*)"],
};
