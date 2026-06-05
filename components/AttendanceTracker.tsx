'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

// Detects WiFi or treats any online connection as "at work"
function isOnWifi(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection
  if (conn?.type) return conn.type === 'wifi'
  // Fallback: treat any online state as "at work"
  return navigator.onLine
}

export default function AttendanceTracker() {
  const { data: session } = useSession()
  const checkedInRef = useRef(false)
  const attendanceIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    const userRole = (session.user as { role?: string })?.role
    // Only track technicians and supervisors
    if (userRole !== 'technician' && userRole !== 'supervisor') return

    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]
    const storageKey = `att_${userId}_${today}`

    // Restore state from localStorage (survives page reload)
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const { id, checkedIn } = JSON.parse(stored)
        attendanceIdRef.current = id
        checkedInRef.current = checkedIn
      }
    } catch { /* ignore */ }

    async function checkIn() {
      if (checkedInRef.current) return
      try {
        const res = await fetch('/api/attendance', { method: 'POST' })
        if (!res.ok) return
        const { id } = await res.json()
        checkedInRef.current = true
        attendanceIdRef.current = id
        localStorage.setItem(storageKey, JSON.stringify({ id, checkedIn: true }))
      } catch { /* silent — don't interrupt UX */ }
    }

    async function checkOut() {
      if (!checkedInRef.current || !attendanceIdRef.current) return
      try {
        const res = await fetch('/api/attendance', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: attendanceIdRef.current }),
        })
        if (!res.ok) return
        // Keep checkedIn true so re-connect doesn't create duplicate session
        // Just update localStorage with the latest checkout info
        localStorage.setItem(storageKey, JSON.stringify({ id: attendanceIdRef.current, checkedIn: true }))
      } catch { /* silent */ }
    }

    // Initial check on mount
    if (isOnWifi()) checkIn()

    // Network Information API change handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection

    function handleConnectionChange() {
      if (isOnWifi()) {
        checkIn()
      } else {
        checkOut()
      }
    }

    function handleOnline() {
      if (isOnWifi()) checkIn()
    }

    function handleOffline() {
      checkOut()
    }

    if (conn) conn.addEventListener('change', handleConnectionChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (conn) conn.removeEventListener('change', handleConnectionChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [session])

  return null
}
