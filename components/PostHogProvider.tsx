'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, Suspense } from 'react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    capture_performance: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
      recordCrossOriginIframes: false,
    },
    capture_exceptions: true,
    persistence: 'localStorage+cookie',
  })

  // Register timezone on every event so PostHog GeoIP + timezone give
  // accurate country / city / region breakdowns in the dashboard
  posthog.register({
    $timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
