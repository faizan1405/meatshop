import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page through — no auth required
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all other /admin paths
  let token;
  try {
    token = await getToken({
      req: request,
      secret:
        process.env.NEXTAUTH_SECRET ||
        (process.env.NODE_ENV !== 'production'
          ? 'dev-only-insecure-secret-do-not-use-in-prod'
          : undefined),
    });
  } catch {
    // Token decoding failed (e.g. secret mismatch after domain change,
    // or NEXTAUTH_SECRET missing in production). Treat as unauthenticated
    // so the user gets redirected to the login page instead of a 404.
    token = null;
  }

  if (!token || token.role !== 'admin') {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
