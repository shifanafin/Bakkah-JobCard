import { betterFetch } from '@better-fetch/fetch'
import { NextRequest, NextResponse } from 'next/server'
import type { Session } from '@/lib/auth'

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes — no login required
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/invoice')
  ) return NextResponse.next()

  const { data: sessionData } = await betterFetch<{ session: Session['session']; user: Session['user'] }>(
    '/api/auth/get-session',
    {
      baseURL: req.nextUrl.origin,
      headers: { cookie: req.headers.get('cookie') ?? '' },
    }
  )

  const isLoggedIn = !!sessionData?.user

  // Redirect unauthenticated users hitting the protected workshop invoice
  // to the public invoice page instead of the login screen
  const workshopInvoiceMatch = pathname.match(/^\/workshop\/job-cards\/([^/]+)\/invoice$/)
  if (workshopInvoiceMatch && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/invoice/${workshopInvoiceMatch[1]}`, req.nextUrl))
  }

  if (!isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|fonts|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)).*)'],
}
