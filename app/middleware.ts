import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.cookies.get('bosshype_token')?.value

  const { pathname } = request.nextUrl

  const authRoutes = ['/login', '/register', '/forgot-password']
  const protectedPatterns = ['/app', '/modules', '/dashboard']

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  const isProtectedRoute = protectedPatterns.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // ===============================
  // SUDAH LOGIN → DILARANG KE AUTH
  // ===============================
  if (token && isAuthRoute) {
    const res = NextResponse.redirect(
      new URL('/modules/dashboard', request.url),
      307
    )

    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')

    return res
  }

  // ===============================
  // BELUM LOGIN → DILARANG KE PROTECTED
  // ===============================
  if (!token && isProtectedRoute) {
    const res = NextResponse.redirect(
      new URL('/login', request.url),
      307
    )

    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')

    return res
  }

  // ===============================
  // ROOT /
  // ===============================
  if (pathname === '/') {
    const res = NextResponse.redirect(
      new URL(token ? '/modules/dashboard' : '/login', request.url),
      307
    )

    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
