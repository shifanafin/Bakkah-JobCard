'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Wrench, Loader2, X, Check, Phone, RefreshCw, Edit2, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'

const SPECIALTIES = ['Technician', 'Inspector', 'Detailer', 'Body Technician', 'Painter', 'Electrician']

const SPECIALTY_COLORS: Record<string, string> = {
  'Technician':      'bg-brand/15 text-brand',
  'Inspector':       'bg-blue-500/15 text-blue-400',
  'Detailer':        'bg-purple-500/15 text-purple-400',
  'Body Technician': 'bg-orange-500/15 text-orange-400',
  'Painter':         'bg-pink-500/15 text-pink-400',
  'Electrician':     'bg-yellow-500/15 text-yellow-400',
}

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
}

export default function TechniciansPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [technicians, setTechnicians] = useState<TechRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<TechRow | null>(null)
  const [editPhone, setEditPhone] = useState('')
  const [editSpecialty, setEditSpecialty] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && role !== 'admin') {
      router.replace('/workshop/dashboard')
    }
  }, [status, role, router])

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

  useEffect(() => { if (role === 'admin') load() }, [role, load])

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

  if (status === 'loading' || (status === 'authenticated' && role !== 'admin')) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Technicians" subtitle="Workshop technician roster" />

      <div className="p-4 space-y-5 max-w-5xl lg:p-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-white/40">
            {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <Link href="/workshop/admin/employees" className="btn-ghost text-xs px-3 py-2 h-auto">
              Manage Accounts →
            </Link>
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
            <p className="text-xs text-gray-400 mt-1 dark:text-white/25">
              Add employees with the Technician role from the Employees page
            </p>
            <Link href="/workshop/admin/employees" className="mt-3 text-xs text-brand hover:underline">
              Go to Employees →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Specialty</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Phone</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Active Jobs</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Joined</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {technicians.map(tech => (
                  <tr key={tech.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-xs">
                          {tech.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                          {tech.username && (
                            <p className="text-xs font-mono text-gray-400 dark:text-white/30">@{tech.username}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        SPECIALTY_COLORS[tech.role] ?? 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/50'
                      )}>
                        {tech.role || 'Technician'}
                      </span>
                    </td>

                    {/* Phone */}
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

                    {/* Active jobs */}
                    <td className="px-4 py-3 text-center">
                      {tech.active_jobs > 0 ? (
                        <Link
                          href={`/workshop/job-cards?technician=${tech.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand hover:bg-brand/25 transition-colors"
                        >
                          <Briefcase className="h-3 w-3" />
                          {tech.active_jobs}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-white/25">0</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                        tech.active
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-red-500/15 text-red-400'
                      )}>
                        {tech.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-gray-400 dark:text-white/30 text-xs">
                      {formatDate(tech.created_at)}
                    </td>

                    {/* Edit */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => openEdit(tech)}
                          title="Edit specialty & phone"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand/40 hover:text-brand transition-colors dark:border-white/[0.08] dark:text-white/30"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
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
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label mb-1">Specialty</label>
                <select
                  value={editSpecialty}
                  onChange={e => setEditSpecialty(e.target.value)}
                  className="input-base w-full"
                >
                  {SPECIALTIES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="input-base w-full pl-9"
                    placeholder="+971 50 123 4567"
                    type="tel"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
