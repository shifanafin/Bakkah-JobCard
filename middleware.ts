import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that are always public — no session required
const PUBLIC_PREFIXES = [
  '/blog',
  '/track',
  '/invoice',
  '/auth',
  '/api/auth',
  '/api/chat-request',
  '/api/track',
  '/api/approve-job',
  '/api/feedback',
  '/api/lookup',
  '/api/test-telegram',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Root and static assets are always public
  if (pathname === '/') return NextResponse.next()

  // Allow all explicitly public paths
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
  if (isPublic) return NextResponse.next()

  // Protect /workshop/* — redirect to login if no session cookie
  if (pathname.startsWith('/workshop')) {
    const token = request.cookies.get('better-auth.session_token')
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon|icons|logo|apple-touch-icon|manifest|sw\\.js|opengraph-image|googlec09f403101dc4724).*)',
  ],
}
