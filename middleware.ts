import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CookieName, UserLevel } from '@/lib/constants';

const PUBLIC_PATHS = new Set<string>(['/', '/login', '/register', '/forgot-password']);

const normalizeLevel = (level: string) => {
  const upperLevel = level.toUpperCase();
  return upperLevel === 'ADMIN' ? UserLevel.ADMIN : upperLevel;
};

const setDefaultLocale = (response: NextResponse, request: NextRequest) => {
  if (!request.cookies.has(CookieName.NEXT_LOCALE)) {
    response.cookies.set(CookieName.NEXT_LOCALE, 'en');
  }
};

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  const response = NextResponse.next();

  setDefaultLocale(response, request);

  // Skip static files and Next.js internals.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.match(/\.(png|jpg|svg|css|js|ico|txt)$/)
  ) {
    return response;
  }

  // Skip API authentication routes.
  if (pathname.startsWith('/api/auth')) {
    return response;
  }

  const token = request.cookies.get(CookieName.AUTH_TOKEN)?.value;

  // Redirect unauthenticated private routes to login.
  if (!isPublic && !token) {
    const url = new URL('/', origin);
    url.searchParams.set('redirect', pathname);
    const redirectRes = NextResponse.redirect(url);
    setDefaultLocale(redirectRes, request);
    return redirectRes;
  }

  // Redirect authenticated users away from public auth pages.
  if (isPublic && token) {
    const redirectRes = NextResponse.redirect(new URL('/dashboard', origin));
    setDefaultLocale(redirectRes, request);
    return redirectRes;
  }

  // Server-side role-based access control
  const levelRaw = request.cookies.get(CookieName.USER_LEVEL)?.value || '';
  const level = normalizeLevel(levelRaw);

  const redirectForbidden = () => {
    const redirectRes = NextResponse.redirect(new URL('/dashboard', origin));
    setDefaultLocale(redirectRes, request);
    return redirectRes;
  };

  // Restrict LHM approval access to permitted roles.
  if (pathname.startsWith('/approval/lhm')) {
    if (
      level !== UserLevel.ADMIN &&
      level !== UserLevel.MANDOR &&
      level !== UserLevel.MD1 &&
      level !== UserLevel.ASISTEN &&
      level !== UserLevel.KSI &&
      level !== UserLevel.MANAGER
    ) {
      return redirectForbidden();
    }
  }

  if (pathname.startsWith('/open/lhm')) {
    if (
      level !== UserLevel.ADMIN &&
      level !== UserLevel.KSI 
    ) {
      return redirectForbidden();
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api/health).*)'],
};
