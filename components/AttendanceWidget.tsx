'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/lib/auth-client'
import { LogIn, LogOut, MapPin, Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Workshop location config ───────────────────────────────────
// Override via NEXT_PUBLIC_WORKSHOP_LAT / NEXT_PUBLIC_WORKSHOP_LNG / NEXT_PUBLIC_CHECKIN_RADIUS_M
const WORKSHOP_LAT  = parseFloat(process.env.NEXT_PUBLIC_WORKSHOP_LAT  ?? '25.2902')
const WORKSHOP_LNG  = parseFloat(process.env.NEXT_PUBLIC_WORKSHOP_LNG  ?? '55.3712')
const ALLOWED_RADIUS_M = parseInt(process.env.NEXT_PUBLIC_CHECKIN_RADIUS_M ?? '200', 10)

// ── Helpers ───────────────────────────────────────────────────

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function getGpsPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 60000,
      enableHighAccuracy: true,
    })
  )
}

async function validateLocation(): Promise<{ ok: boolean; message: string }> {
  if (!('geolocation' in navigator)) {
    return { ok: false, message: 'Location is not supported by your browser.' }
  }
  try {
    const pos = await getGpsPosition()
    const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, WORKSHOP_LAT, WORKSHOP_LNG)
    if (dist <= ALLOWED_RADIUS_M) {
      return { ok: true, message: `${Math.round(dist)}m from workshop` }
    }
    return {
      ok: false,
      message: `You're ${Math.round(dist)}m away. Must be within ${ALLOWED_RADIUS_M}m of the workshop.`,
    }
  } catch {
    return { ok: false, message: 'Location access denied. Enable location permission to check in.' }
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function useLiveTimer(checkinAt: string | null) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!checkinAt) { setElapsed(''); return }
    const tick = () => {
      const diff = Math.max(0, Date.now() - new Date(checkinAt).getTime())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setElapsed(`${h}h ${m < 10 ? '0' : ''}${m}m`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [checkinAt])
  return elapsed
}

type AttRecord = { id: string; checkin_at: string; checkout_at: string | null } | null

// ── Widget ────────────────────────────────────────────────────

export default function AttendanceWidget() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role
  const userId = session?.user?.id

  const [record, setRecord] = useState<AttRecord>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const storageKey = useRef('')
  const elapsed = useLiveTimer(record && !record.checkout_at ? record.checkin_at : null)

  // Only render for technicians and supervisors
  if (!role || !['technician', 'supervisor'].includes(role)) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!userId) return
    const today = new Date().toISOString().split('T')[0]
    storageKey.current = `att_widget_${userId}_${today}`

    // Restore from localStorage immediately (instant UI)
    try {
      const stored = localStorage.getItem(storageKey.current)
      if (stored) setRecord(JSON.parse(stored))
    } catch { /* ignore */ }

    // Sync from server
    fetch('/api/attendance?today=true')
      .then(r => r.json())
      .then(d => {
        if (d.record !== undefined) {
          setRecord(d.record)
          if (d.record) localStorage.setItem(storageKey.current, JSON.stringify(d.record))
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const isCheckedIn  = !!record && !record.checkout_at
  const isCheckedOut = !!record && !!record.checkout_at

  async function handleCheckIn() {
    setBusy(true)
    setError('')
    setHint('Getting location…')

    try {
      const { ok, message } = await validateLocation()
      if (!ok) { setError(message); setHint(''); setBusy(false); return }

      setHint('📍 ' + message)

      const res = await fetch('/api/attendance', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to check in')

      const rec: AttRecord = { id: json.id, checkin_at: json.checkin_at, checkout_at: null }
      setRecord(rec)
      localStorage.setItem(storageKey.current, JSON.stringify(rec))
      setHint('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-in failed')
      setHint('')
    } finally {
      setBusy(false)
    }
  }

  async function handleCheckOut() {
    if (!record) return
    setBusy(true)
    setError('')
    setHint('Getting location…')

    try {
      const { ok, message } = await validateLocation()
      if (!ok) { setError(message); setHint(''); setBusy(false); return }

      setHint('📍 ' + message)

      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to check out')

      const rec: AttRecord = { ...record, checkout_at: json.checkout_at }
      setRecord(rec)
      localStorage.setItem(storageKey.current, JSON.stringify(rec))
      setHint('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-out failed')
      setHint('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-3 mb-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
      {/* Status row */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn(
          'h-2.5 w-2.5 rounded-full shrink-0 transition-colors duration-300',
          isCheckedIn ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
          isCheckedOut ? 'bg-gray-400' : 'bg-red-400'
        )} />
        <span className="text-xs font-bold text-gray-700 dark:text-white/70">
          {isCheckedIn ? 'On Duty' : isCheckedOut ? 'Checked Out' : 'Off Duty'}
        </span>
        {isCheckedIn && elapsed && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 dark:text-white/30">
            <Clock className="h-3 w-3" />{elapsed}
          </span>
        )}
      </div>

      {/* Times */}
      {record && (
        <div className="mb-2.5 space-y-0.5 text-[11px] text-gray-500 dark:text-white/40">
          <div className="flex items-center gap-1.5">
            <LogIn className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>In: <span className="font-medium text-gray-700 dark:text-white/60">{formatTime(record.checkin_at)}</span></span>
          </div>
          {record.checkout_at && (
            <div className="flex items-center gap-1.5">
              <LogOut className="h-3 w-3 text-gray-400 shrink-0" />
              <span>Out: <span className="font-medium text-gray-700 dark:text-white/60">{formatTime(record.checkout_at)}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint */}
      {hint && !error && (
        <div className="mb-2 text-[11px] text-gray-400 dark:text-white/30 text-center">{hint}</div>
      )}

      {/* Action button */}
      {!isCheckedOut && (
        <button
          onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={busy}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200',
            isCheckedIn
              ? 'bg-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 dark:bg-white/[0.07] dark:text-white/60 dark:hover:bg-red-500/10 dark:hover:text-red-400'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isCheckedIn ? (
            <><LogOut className="h-3.5 w-3.5" />Check Out</>
          ) : (
            <><LogIn className="h-3.5 w-3.5" />Check In</>
          )}
        </button>
      )}

      {isCheckedOut && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-white/30">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          Done for today
        </div>
      )}

      {/* Location note */}
      <p className="mt-2 text-center text-[10px] text-gray-400/60 dark:text-white/20 leading-tight">
        <MapPin className="inline h-2.5 w-2.5 mr-0.5" />
        Requires workshop location
      </p>
    </div>
  )
}
