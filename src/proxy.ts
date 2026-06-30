import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page through — no auth required
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all other /admin paths
  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET ||
      (process.env.NODE_ENV !== 'production'
        ? 'dev-only-insecure-secret-do-not-use-in-prod'
        : undefined),
  });

  if (!token || token.role !== 'admin') {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
