import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get('session_token')?.value
    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/verify-email']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If user is authenticated and tries to access auth pages, redirect to home
    if (sessionToken && isPublicRoute) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If user is NOT authenticated and tries to access protected pages (everything else), redirect to login
    if (!sessionToken && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
