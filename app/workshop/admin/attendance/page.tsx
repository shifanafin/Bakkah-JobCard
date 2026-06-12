'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import {
  Loader2, RefreshCw, Clock, LogIn, LogOut,
  CheckCircle, BarChart2, UserCheck, UserX,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type AttendanceRecord = {
  id: string
  name: string
  role: string
  active: boolean
  attendance: {
    id: string
    checkin_at: string
    checkout_at: string | null
  } | null
  jobs_closed_today: number
  active_jobs: number
  total_jobs: number
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function hoursWorked(checkin: string, checkout: string | null): string {
  const end = checkout ? new Date(checkout) : new Date()
  const diff = Math.max(0, end.getTime() - new Date(checkin).getTime())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m`
}

export default function AttendancePage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Per-row attendance action loading state
  const [attLoading, setAttLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && session && role !== 'admin') {
      router.replace('/workshop/dashboard')
    }
  }, [isPending, role, router, session])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?date=${date}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRecords(json.records ?? [])
    } catch {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    if (role === 'admin') load()
  }, [role, load])

  // ── Attendance overrides ────────────────────────────────────────────────────
  const isToday = date === new Date().toISOString().split('T')[0]

  async function handleCheckIn(record: AttendanceRecord) {
    setAttLoading(record.id)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forUserId: record.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${record.name} checked in${json.alreadyIn ? ' (already in)' : ''}`)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setAttLoading(null)
    }
  }

  async function handleCheckOut(record: AttendanceRecord) {
    setAttLoading(record.id)
    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forUserId: record.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${record.name} checked out`)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Check-out failed')
    } finally {
      setAttLoading(null)
    }
  }

  if (isPending || (!isPending && session && role !== 'admin')) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  }

  const checkedIn  = records.filter(r => r.attendance?.checkin_at && !r.attendance?.checkout_at)
  const checkedOut = records.filter(r => r.attendance?.checkout_at)
  const absent     = records.filter(r => !r.attendance)
  const totalJobsClosedToday = records.reduce((s, r) => s + r.jobs_closed_today, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Attendance" subtitle="Check-in / check-out tracking" />

      <div className="p-4 space-y-5 min-w-full lg:p-6">

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
              className="input-base text-sm px-3 py-2 h-auto"
            />
          </div>
          <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Checked In',          value: checkedIn.length,        icon: UserCheck,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Checked Out',         value: checkedOut.length,       icon: LogOut,      color: 'text-gray-400',    bg: 'bg-gray-500/10' },
            { label: 'Absent',              value: absent.length,           icon: UserX,       color: 'text-red-400',     bg: 'bg-red-500/10' },
            { label: 'Jobs Closed Today',   value: totalJobsClosedToday,    icon: CheckCircle, color: 'text-brand',       bg: 'bg-brand/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card cursor-default">
              <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3', bg)}>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
        ) : records.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <Clock className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
            <p className="text-sm text-gray-400">No staff to display</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  {['Staff', 'Role', 'Check-in', 'Check-out', 'Hours', 'Closed Today', 'Active Jobs', 'Total Jobs', ...(isToday ? ['Action'] : [])].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {records.map(r => {
                  const att = r.attendance
                  const isIn  = att && !att.checkout_at
                  const isOut = att && att.checkout_at
                  const isActioning = attLoading === r.id

                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Staff */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-xs">
                              {r.name[0]?.toUpperCase()}
                            </div>
                            {isIn && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-surface-800" />}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                          r.role === 'technician' ? 'bg-brand/15 text-brand' : 'bg-amber-500/15 text-amber-400'
                        )}>
                          {r.role}
                        </span>
                      </td>

                      {/* Check-in */}
                      <td className="px-4 py-3">
                        {att ? (
                          <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                            <LogIn className="h-3.5 w-3.5" />
                            {formatTime(att.checkin_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-white/25 italic">Not in</span>
                        )}
                      </td>

                      {/* Check-out */}
                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="flex items-center gap-1.5 text-gray-500 dark:text-white/50 font-medium">
                            <LogOut className="h-3.5 w-3.5" />
                            {formatTime(att!.checkout_at!)}
                          </span>
                        ) : isIn ? (
                          <span className="text-xs text-emerald-400 font-medium">Still in</span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-white/25">—</span>
                        )}
                      </td>

                      {/* Hours */}
                      <td className="px-4 py-3 text-gray-600 dark:text-white/60 font-mono text-xs">
                        {att ? hoursWorked(att.checkin_at, att.checkout_at) : '—'}
                      </td>

                      {/* Jobs closed today */}
                      <td className="px-4 py-3">
                        <span className={cn('font-bold text-sm', r.jobs_closed_today > 0 ? 'text-emerald-500' : 'text-gray-400 dark:text-white/25')}>
                          {r.jobs_closed_today}
                        </span>
                      </td>

                      {/* Active jobs */}
                      <td className="px-4 py-3">
                        <span className={cn('font-bold text-sm', r.active_jobs > 0 ? 'text-brand' : 'text-gray-400 dark:text-white/25')}>
                          {r.active_jobs}
                        </span>
                      </td>

                      {/* Total jobs */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5 text-gray-400 dark:text-white/25" />
                          <span className="text-gray-700 dark:text-white/70 font-medium">{r.total_jobs}</span>
                        </div>
                      </td>

                      {/* Action — today only */}
                      {isToday && (
                        <td className="px-4 py-3">
                          {isOut ? (
                            <span className="text-xs text-gray-400 dark:text-white/25 italic">Done</span>
                          ) : isIn ? (
                            <button
                              onClick={() => handleCheckOut(r)}
                              disabled={isActioning}
                              className="flex items-center gap-1 rounded-lg border border-orange-200 dark:border-orange-500/30 px-2.5 py-1 text-xs font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                              Check Out
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(r)}
                              disabled={isActioning}
                              className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}
                              Check In
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-white/30">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Checked in</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> Checked out</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Absent</span>
          {isToday && <span className="ml-2 italic">Action buttons only available for today's view.</span>}
        </div>

      </div>
    </div>
  )
}
