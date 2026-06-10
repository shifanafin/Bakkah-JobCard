'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, Suspense } from 'react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',

    // ── Page tracking ────────────────────────────────────
    capture_pageview: false,   // manual — fired in PageView below
    capture_pageleave: true,   // capture when user leaves a page

    // ── Auto-capture ────────────────────────────────────
    autocapture: true,         // clicks, form submits, change events

    // ── Performance / Web Vitals ────────────────────────
    capture_performance: true, // LCP, CLS, FID, FCP, TTFB

    // ── Session recording ───────────────────────────────
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,        // always mask passwords
      },
      recordCrossOriginIframes: false,
    },

    // ── Error / exception tracking ──────────────────────
    capture_exceptions: true,  // unhandled JS exceptions + promise rejections

    // ── Misc ────────────────────────────────────────────
    persistence: 'localStorage+cookie',
    bootstrap: {},
  })
}

function PageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (!pathname || !ph) return
    let url = window.origin + pathname
    if (searchParams.toString()) url += `?${searchParams.toString()}`
    ph.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, ph])

  return null
}

function UserIdentifier() {
  const { data: session, status } = useSession()
  const ph = usePostHog()

  useEffect(() => {
    if (!ph) return
    if (status === 'authenticated' && session?.user) {
      const user = session.user as { id?: string; email?: string; name?: string; role?: string }
      ph.identify(user.id ?? user.email ?? undefined, {
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        role: user.role ?? undefined,
      })
    } else if (status === 'unauthenticated') {
      ph.reset()
    }
  }, [session, status, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageView />
        <UserIdentifier />
      </Suspense>
      {children}
    </PHProvider>
  )
}
