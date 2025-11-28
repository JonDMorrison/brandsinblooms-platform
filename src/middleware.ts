import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for host-based site resolution
 * Routes requests to the correct site based on the hostname
 */
export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || ''
    const pathname = request.nextUrl.pathname

    // Skip middleware for:
    // - Dashboard routes (use site ID from URL)
    // - API routes
    // - Static files
    // - Next.js internals
    if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico')
    ) {
        return NextResponse.next()
    }

    // For public routes, we'll let the page components handle site resolution
    // using getSiteByDomain/getSiteByHostname in their server components
    // This avoids the complexity of middleware database calls

    // Add hostname to headers for downstream use
    const response = NextResponse.next()
    response.headers.set('x-hostname', hostname)

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
