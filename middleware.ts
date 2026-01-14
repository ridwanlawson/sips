// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>(["/", "/login", "/register", "/forgot-password"]);

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Skip untuk file statis & _next
  if (pathname.startsWith("/_next") || pathname.startsWith("/assets") || pathname.match(/\.(png|jpg|svg|css|js|ico|txt)$/)) {
    return NextResponse.next();
  }

  // (opsional) Skip untuk API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  // Tidak ada token & route privat -> lempar ke /login
  if (!isPublic && !token) {
    const url = new URL("/", origin);
    url.searchParams.set("redirect", pathname); // opsional: simpan tujuan
    return NextResponse.redirect(url);
  }

  // Sudah login & sedang di halaman public -> lempar ke dashboard
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // Restrict access to attendance approval page to ADM and MGR only (server-side)
  // This prevents users without proper level from loading the page URL directly.
  if (pathname.startsWith("/attendance/approval")) {
    const levelRaw =
      request.cookies.get("user_Level")?.value ||
      request.cookies.get("user_level")?.value ||
      request.cookies.get("user_LEVEL")?.value ||
      "";
    const level = String(levelRaw).toUpperCase();
    if (level !== "ADM" && level !== "MGR") {
      // Redirect to a safer page (dashboard) for unauthorized users
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  // Restrict access to attendance upload page to MGR only
  if (pathname.startsWith("/attendance/upload")) {
    const levelRaw =
      request.cookies.get("user_Level")?.value ||
      request.cookies.get("user_level")?.value ||
      request.cookies.get("user_LEVEL")?.value ||
      "";
    const level = String(levelRaw).toUpperCase();
    if (level !== "MGR") {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan hanya di path ini
  matcher: ["/((?!api/health).*)"], // contoh: tetap jalankan hampir semua, kecuali endpoint tertentu
  // atau spesifik:
  // matcher: ["/", "/login", "/register", "/dashboard/:path*", "/user/:path*"],
};
