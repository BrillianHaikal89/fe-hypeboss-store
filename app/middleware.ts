import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.cookies.get('bosshype_token')?.value
  
  const { pathname } = request.nextUrl

  // Route yang hanya bisa diakses jika belum login
  const authRoutes = ['/login', '/register', '/forgot-password']
  
  // Route yang memerlukan autentikasi
  const protectedRoutes = ['/app', '/login/dashboard']

  // Jika sudah login dan mencoba akses halaman auth
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }

  // Jika belum login dan mencoba akses protected route
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}