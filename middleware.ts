import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('bosshype_token')?.value;
  
  // Jika mencoba mengakses halaman yang membutuhkan auth tanpa token
  const isAuthPage = request.nextUrl.pathname.startsWith('/dashboard');
  
  if (isAuthPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Jika sudah login tapi mengakses login page
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};