// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>(["/", "/login", "/register", "/forgot-password"]);

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
  if (pathname.startsWith("/_next") || pathname.startsWith("/assets") || pathname.match(/\.(png|jpg|svg|css|js|ico|txt)$/)) {
    return response;
  }

  // (opsional) Skip untuk API auth routes
  if (pathname.startsWith("/api/auth")) {
    return response;
  }

  const token = request.cookies.get("auth_token")?.value;

  // Tidak ada token & route privat -> lempar ke /login
  if (!isPublic && !token) {
    const url = new URL("/", origin);
    url.searchParams.set("redirect", pathname); // opsional: simpan tujuan
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
  const level = String(levelRaw).toUpperCase();

  // Restrict access to attendance approval page to ADM and MGR only
  if (pathname.startsWith("/attendance/approval")) {
    if (level !== "ADM" && level !== "MGR") {
      const redirectRes = NextResponse.redirect(new URL("/dashboard", origin));
      if (!request.cookies.has("NEXT_LOCALE")) {
        redirectRes.cookies.set("NEXT_LOCALE", "en");
      }
      return redirectRes;
    }
  }

  // Restrict access to upload pages to ADM and MGR only
  if (pathname.startsWith("/attendance/upload") || pathname.startsWith("/harvest/upload") || pathname.startsWith("/harvesting-quality/upload")) {
    if (level !== "ADM" && level !== "MGR") {
      const redirectRes = NextResponse.redirect(new URL("/dashboard", origin));
      if (!request.cookies.has("NEXT_LOCALE")) {
        redirectRes.cookies.set("NEXT_LOCALE", "en");
      }
      return redirectRes;
    }
  }

  // Restrict access to APK upload page to ADM only
  if (pathname.startsWith("/apk-upload")) {
    if (level !== "ADM") {
      const redirectRes = NextResponse.redirect(new URL("/dashboard", origin));
      if (!request.cookies.has("NEXT_LOCALE")) {
        redirectRes.cookies.set("NEXT_LOCALE", "en");
      }
      return redirectRes;
    }
  }

  return response;
}

export const config = {
  // Jalankan hanya di path ini
  matcher: ["/((?!api/health).*)"], // contoh: tetap jalankan hampir semua, kecuali endpoint tertentu
  // atau spesifik:
  // matcher: ["/", "/login", "/register", "/dashboard/:path*", "/user/:path*"],
};
