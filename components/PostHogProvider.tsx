'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
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

// Must only be rendered inside a SessionProvider (workshop layout).
// Identifies the logged-in staff member in PostHog.
export function PostHogUserIdentifier() {
  const { data: session, isPending } = useSession()
  const ph = usePostHog()

  useEffect(() => {
    if (!ph) return
    if (!isPending && session?.user) {
      const user = session.user as { id?: string; email?: string; name?: string; role?: string }
      ph.identify(user.id ?? user.email ?? undefined, {
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        role: user.role ?? undefined,
      })
    } else if (!isPending && !session) {
      ph.reset()
    }
  }, [session, isPending, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
