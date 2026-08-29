import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authjs.session-token')?.value
    || request.cookies.get('__Secure-authjs.session-token')?.value;

  // Allow login page without auth
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
