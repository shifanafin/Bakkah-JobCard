'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import Header from '@/components/layout/Header'
import { CalendarClock, LogIn, LogOut, Loader2, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

type AttendanceRecord = { id: string; date: string; checkin_at: string; checkout_at: string | null }
type TodayRecord = { id: string; checkin_at: string; checkout_at: string | null } | null

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short' })
}
function calcDuration(checkin: string, checkout: string) {
  const ms = new Date(checkout).getTime() - new Date(checkin).getTime()
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function AttendancePage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? ''
  const name = session?.user?.name?.split(' ')[0] ?? 'there'

  const [today, setToday] = useState<TodayRecord>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)

  const load = useCallback(async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch('/api/attendance?today=true'),
        fetch('/api/attendance?history=true&days=30'),
      ])
      const todayData = await todayRes.json()
      const histData = await histRes.json()
      setToday(todayData.record ?? null)
      setHistory(histData.records ?? [])
    } catch {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCheckIn() {
    setActioning(true)
    try {
      const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.alreadyIn ? 'Already checked in today' : 'Checked in successfully!')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setActioning(false)
    }
  }

  async function handleCheckOut() {
    if (!today) return
    setActioning(true)
    try {
      const res = await fetch('/api/attendance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: today.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Checked out successfully!')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-out failed')
    } finally {
      setActioning(false)
    }
  }

  const isCheckedIn = !!today && !today.checkout_at
  const isCheckedOut = !!today?.checkout_at
  const canRecord = role !== 'admin'

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  // Admin sees readonly message
  if (role === 'admin') return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Attendance" subtitle="Staff time tracking" />
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <CalendarClock className="h-10 w-10 text-gray-300 dark:text-white/20" />
          <p className="text-sm font-medium text-gray-500 dark:text-white/40">
            Admins manage staff attendance from the Technicians page.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Attendance" subtitle={`${name}'s time tracking`} />

      <div className="p-4 pb-28 lg:p-6 lg:pb-8 max-w-2xl mx-auto space-y-5">

        {/* Today's status card */}
        <div className={`rounded-2xl p-6 shadow-sm border ${
          isCheckedIn
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
            : isCheckedOut
              ? 'bg-white border-gray-100 dark:bg-surface-800 dark:border-white/[0.06]'
              : 'bg-white border-gray-100 dark:bg-surface-800 dark:border-white/[0.06]'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                {new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">Today</h2>
            </div>
            {isCheckedIn && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            )}
            {isCheckedOut && (
              <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] px-3 py-1">
                <CheckCircle className="h-3.5 w-3.5 text-gray-400 dark:text-white/30" />
                <span className="text-xs font-bold text-gray-500 dark:text-white/40">Done</span>
              </div>
            )}
            {!today && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Not in</span>
              </div>
            )}
          </div>

          {/* Times */}
          {today && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-white/70 dark:bg-white/[0.04] p-3 border border-white dark:border-white/[0.06]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Check In</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{fmtTime(today.checkin_at)}</p>
              </div>
              <div className="rounded-xl bg-white/70 dark:bg-white/[0.04] p-3 border border-white dark:border-white/[0.06]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Check Out</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {today.checkout_at ? fmtTime(today.checkout_at) : '—'}
                </p>
              </div>
            </div>
          )}
          {!today && (
            <p className="text-sm text-gray-400 dark:text-white/30 mb-5">You haven't checked in yet today.</p>
          )}

          {/* Action button */}
          {canRecord && (
            <div className="flex gap-3">
              {!isCheckedOut && (
                isCheckedIn ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={actioning}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 shadow-lg shadow-orange-500/20"
                  >
                    {actioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Check Out
                  </button>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={actioning}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 active:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  >
                    {actioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Check In
                  </button>
                )
              )}
              {isCheckedOut && today && (
                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] px-4 py-3">
                  <Clock className="h-4 w-4 text-gray-400 dark:text-white/30" />
                  <span className="text-sm font-bold text-gray-500 dark:text-white/40">
                    Duration: {calcDuration(today.checkin_at, today.checkout_at!)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attendance history */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3">Recent Attendance</p>
          {history.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-8 text-center">
              <CalendarClock className="h-8 w-8 text-gray-200 dark:text-white/10 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-white/30">No attendance records yet</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
              {history.map(rec => (
                <div key={rec.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${
                    rec.checkout_at ? 'bg-gray-100 dark:bg-white/[0.06]' : 'bg-emerald-500/10'
                  }`}>
                    {rec.checkout_at
                      ? <CheckCircle className="h-4 w-4 text-gray-400 dark:text-white/30" />
                      : <Clock className="h-4 w-4 text-emerald-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtDate(rec.date)}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40">
                      {fmtTime(rec.checkin_at)}
                      {rec.checkout_at ? ` – ${fmtTime(rec.checkout_at)}` : ' · still in'}
                    </p>
                  </div>
                  {rec.checkout_at && (
                    <span className="shrink-0 text-xs font-bold text-gray-500 dark:text-white/40">
                      {calcDuration(rec.checkin_at, rec.checkout_at)}
                    </span>
                  )}
                  {!rec.checkout_at && (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links for ERP features */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3">Employee Services</p>
          <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
            {[
              { href: '/workshop/my/leave', label: 'Leave Requests', desc: 'Apply for annual, sick or emergency leave', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { href: '/workshop/my/suggestions', label: 'Suggestions', desc: 'Share ideas to improve the workshop', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { href: '/workshop/my/complaints', label: 'Complaints', desc: 'Report an issue or concern', color: 'text-orange-500', bg: 'bg-orange-500/10' },
            ].map(item => (
              <a key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-white/[0.03] transition-colors">
                <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${item.bg}`}>
                  <CalendarClock className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-white/20 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
