import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes — no login required
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/invoice')
  ) return NextResponse.next()

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
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
