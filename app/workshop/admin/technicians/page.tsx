'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import {
  Wrench, Loader2, X, Check, Phone, RefreshCw, Edit2, Briefcase,
  Plus, Trash2, LogIn, LogOut, Eye, EyeOff, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'

const SPECIALTIES = ['Technician', 'Inspector', 'Detailer', 'Body Technician', 'Painter', 'Electrician']

const SPECIALTY_COLORS: Record<string, string> = {
  'Technician':      'bg-brand/15 text-brand',
  'Inspector':       'bg-blue-500/15 text-blue-400',
  'Detailer':        'bg-purple-500/15 text-purple-400',
  'Body Technician': 'bg-golden/15 text-golden',
  'Painter':         'bg-pink-500/15 text-pink-400',
  'Electrician':     'bg-yellow-500/15 text-yellow-400',
}

type AttendanceRecord = { id: string; checkin_at: string; checkout_at: string | null } | null

type TechRow = {
  id: string
  name: string
  phone: string | null
  role: string
  active: boolean
  created_at: string
  email: string | null
  username: string | null
  active_jobs: number
  today_attendance: AttendanceRecord
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function TechniciansPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [technicians, setTechnicians] = useState<TechRow[]>([])
  const [loading, setLoading] = useState(true)

  // Edit modal
  const [editTarget, setEditTarget] = useState<TechRow | null>(null)
  const [editPhone, setEditPhone] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [saving, setSaving] = useState(false)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', username: '', phone: '', specialty: 'Technician', password: '' })
  const [creating, setCreating] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<TechRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Attendance action loading state (keyed by userId)
  const [attLoading, setAttLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && session && role !== 'admin' && role !== 'supervisor') {
      router.replace('/workshop/dashboard')
    }
  }, [isPending, role, router, session])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/technicians')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTechnicians(json.technicians ?? [])
    } catch {
      toast.error('Failed to load technicians')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'admin' || role === 'supervisor') load()
  }, [role, load])

  // â"€â"€ Edit â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  function openEdit(tech: TechRow) {
    setEditTarget(tech)
    setEditPhone(tech.phone ?? '')
    setEditSpecialty(tech.role || 'Technician')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, phone: editPhone, specialty: editSpecialty }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Technician updated')
      setEditTarget(null)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // â"€â"€ Create â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Technician created')
      setShowCreate(false)
      setCreateForm({ name: '', email: '', username: '', phone: '', specialty: 'Technician', password: '' })
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  // â"€â"€ Delete â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  // â"€â"€ Attendance overrides â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  async function handleCheckIn(tech: TechRow) {
    setAttLoading(tech.id)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forUserId: tech.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${tech.name} checked in${json.alreadyIn ? ' (already in)' : ''}`)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setAttLoading(null)
    }
  }

  async function handleCheckOut(tech: TechRow) {
    setAttLoading(tech.id)
    try {
      const res = await fetch('/api/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forUserId: tech.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${tech.name} checked out`)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Check-out failed')
    } finally {
      setAttLoading(null)
    }
  }

  const isLoading = isPending || (!isPending && session && role !== 'admin' && role !== 'supervisor')

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const inputCls = 'input-base w-full'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Technicians" subtitle="Workshop technician roster" />

      <div className="p-4 space-y-5 w-full max-w-full lg:p-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-white/40">
            {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              New Technician
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : technicians.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 mb-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Wrench className="h-8 w-8 text-gray-300 dark:text-white/20" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-white/40">No technicians yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-brand hover:underline">
              Add First Technician â†’
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                    {['Name', 'Specialty', 'Phone', 'Active Jobs', 'Status', 'Today\'s Attendance', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                  {technicians.map(tech => {
                    const att = tech.today_attendance
                    const checkedIn  = att && !att.checkout_at
                    const checkedOut = att && att.checkout_at
                    const isActioning = attLoading === tech.id

                    return (
                      <tr key={tech.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-xs">
                                {tech.name[0]?.toUpperCase()}
                              </div>
                              {checkedIn && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-surface-800" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                              {tech.username && (
                                <p className="text-xs font-mono text-gray-400 dark:text-white/30">@{tech.username}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', SPECIALTY_COLORS[tech.role] ?? 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50')}>
                            {tech.role || 'Technician'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {tech.phone ? (
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-white/70">
                              <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-white/30" />
                              {tech.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-white/25 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tech.active_jobs > 0 ? (
                            <Link href={`/workshop/job-cards?technician=${tech.id}`} className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand hover:bg-brand/25 transition-colors">
                              <Briefcase className="h-3 w-3" />
                              {tech.active_jobs}
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-white/25">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', tech.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400')}>
                            {tech.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {checkedOut ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500 dark:text-white/40">{fmtTime(att!.checkin_at)} â€" {fmtTime(att!.checkout_at!)}</span>
                                <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 font-medium">Done</span>
                              </div>
                            ) : checkedIn ? (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  In since {fmtTime(att!.checkin_at)}
                                </span>
                                <button onClick={() => handleCheckOut(tech)} disabled={isActioning} className="flex items-center gap-1 rounded-lg border border-orange-200 dark:border-orange-500/30 px-2 py-0.5 text-[10px] font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50">
                                  {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                                  Check Out
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 dark:text-white/25 italic">Absent</span>
                                <button onClick={() => handleCheckIn(tech)} disabled={isActioning} className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                                  {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}
                                  Check In
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 dark:text-white/30 text-xs">{formatDate(tech.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(tech)} title="Edit" className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand/40 hover:text-brand transition-colors dark:border-white/[0.08] dark:text-white/30">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(tech)} title="Delete" className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-400/40 hover:text-red-400 transition-colors dark:border-white/[0.08] dark:text-white/30">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 divide-y divide-gray-100 dark:divide-white/[0.05]">
              {technicians.map(tech => {
                const att = tech.today_attendance
                const checkedIn  = att && !att.checkout_at
                const checkedOut = att && att.checkout_at
                const isActioning = attLoading === tech.id
                return (
                  <div
                    key={tech.id}
                    className="p-4 space-y-3 cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.02] transition-colors"
                    onClick={() => openEdit(tech)}
                  >
                    {/* Row 1: avatar + name + specialty */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-sm">
                            {tech.name[0]?.toUpperCase()}
                          </div>
                          {checkedIn && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-surface-800" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{tech.name}</p>
                          {tech.username && <p className="text-xs font-mono text-gray-400 dark:text-white/30">@{tech.username}</p>}
                        </div>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', SPECIALTY_COLORS[tech.role] ?? 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50')}>
                        {tech.role || 'Technician'}
                      </span>
                    </div>

                    {/* Row 2: phone + status + active jobs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {tech.phone ? (
                        <span className="flex items-center gap-1 text-gray-600 dark:text-white/60 text-xs">
                          <Phone className="h-3 w-3 text-gray-400" />{tech.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-white/25 italic">No phone</span>
                      )}
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', tech.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400')}>
                        {tech.active ? 'Active' : 'Inactive'}
                      </span>
                      {tech.active_jobs > 0 && (
                        <span onClick={e => e.stopPropagation()}>
                          <Link href={`/workshop/job-cards?technician=${tech.id}`} className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
                            <Briefcase className="h-3 w-3" />{tech.active_jobs} job{tech.active_jobs !== 1 ? 's' : ''}
                          </Link>
                        </span>
                      )}
                    </div>

                    {/* Row 3: attendance + delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs">
                        {checkedOut ? (
                          <span className="text-gray-500 dark:text-white/40">{fmtTime(att!.checkin_at)} – {fmtTime(att!.checkout_at!)}</span>
                        ) : checkedIn ? (
                          <span className="flex items-center gap-1 text-emerald-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In since {fmtTime(att!.checkin_at)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-white/25 italic">Not checked in</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        {!checkedOut && (
                          checkedIn ? (
                            <button onClick={() => handleCheckOut(tech)} disabled={isActioning} className="flex items-center gap-1 rounded-lg border border-orange-200 dark:border-orange-500/30 px-2.5 py-1 text-xs font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50">
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                              Out
                            </button>
                          ) : (
                            <button onClick={() => handleCheckIn(tech)} disabled={isActioning} className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                              {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />}
                              In
                            </button>
                          )
                        )}
                        <button onClick={() => setDeleteTarget(tech)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-400/40 hover:text-red-400 transition-colors dark:border-white/[0.08] dark:text-white/30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Checked in today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> Checked out
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Not checked in
          </span>
        </div>
      </div>

      {/* â"€â"€ Create Technician Modal â"€â"€ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-surface-800 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]"
          >
            {/* iOS drag handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-white/[0.15]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">New Technician</h2>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Creates a login account and technician profile</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition dark:text-white/30 dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <form id="create-tech-form" onSubmit={handleCreate} className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label mb-1">Full Name <span className="text-brand">*</span></label>
                  <input
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Mohammed Al Rashid"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="label mb-1">Email <span className="text-brand">*</span></label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="technician@email.com"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="label mb-1">Username <span className="text-brand">*</span></label>
                  <input
                    value={createForm.username}
                    onChange={e => setCreateForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                    placeholder="m.rashid"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="label mb-1">Specialty</label>
                  <select
                    value={createForm.specialty}
                    onChange={e => setCreateForm(f => ({ ...f, specialty: e.target.value }))}
                    className={inputCls}
                  >
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-1">Phone</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+971 50 123 4567"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label mb-1">Temporary Password <span className="text-brand">*</span></label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="At least 8 characters"
                      className={cn(inputCls, 'pr-10')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Fixed footer — always above the home indicator */}
            <div
              className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
            >
              <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" form="create-tech-form" disabled={creating} className="btn-primary flex-1">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ Edit Modal â"€â"€ */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-surface-800 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]"
          >
            {/* iOS drag handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-white/[0.15]" />
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit Technician</h2>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{editTarget.name}</p>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition dark:text-white/30 dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form id="edit-tech-form" onSubmit={handleSave} className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
              <div>
                <label className="label mb-1">Specialty</label>
                <select value={editSpecialty} onChange={e => setEditSpecialty(e.target.value)} className={inputCls}>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="input-base w-full ltr:pl-9 rtl:pr-9"
                    placeholder="+971 50 123 4567"
                    type="tel"
                  />
                </div>
              </div>
            </form>

            <div
              className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
            >
              <button type="button" onClick={() => setEditTarget(null)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" form="edit-tech-form" disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ Delete Confirm Modal â"€â"€ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 mx-auto">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-center">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Delete Technician</h2>
                <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
                  Are you sure you want to delete <strong className="text-gray-700 dark:text-white/70">{deleteTarget.name}</strong>?
                  {deleteTarget.active_jobs > 0 && (
                    <span className="block mt-1 text-amber-500">
                      This will unassign them from {deleteTarget.active_jobs} active job{deleteTarget.active_jobs !== 1 ? 's' : ''}.
                    </span>
                  )}
                  <span className="block mt-1 text-xs text-gray-400">This action cannot be undone.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

