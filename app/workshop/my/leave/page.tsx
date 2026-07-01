'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { ChevronLeft, CalendarDays, Plus, Loader2, Check, Clock, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type LeaveType = 'annual' | 'sick' | 'emergency' | 'unpaid'
type LeaveStatus = 'pending' | 'approved' | 'rejected'

type LeaveRequest = {
  id: string
  type: LeaveType
  from_date: string
  to_date: string
  reason: string | null
  status: LeaveStatus
  admin_note: string | null
  created_at: string
}

const LEAVE_TYPES: { value: LeaveType; label: string; color: string; bg: string }[] = [
  { value: 'annual', label: 'Annual Leave', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'sick', label: 'Sick Leave', color: 'text-red-500', bg: 'bg-red-500/10' },
  { value: 'emergency', label: 'Emergency Leave', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { value: 'unpaid', label: 'Unpaid Leave', color: 'text-gray-500', bg: 'bg-gray-500/10' },
]

const STATUS_STYLE: Record<LeaveStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-500',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
}
function diffDays(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

export default function LeaveRequestPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ type: 'annual' as LeaveType, from_date: '', to_date: '', reason: '' })

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/my/leave')
      const data = await res.json()
      setRequests(data.requests ?? [])
    } catch { setRequests([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.from_date || !form.to_date) { toast.error('Please select dates'); return }
    if (form.to_date < form.from_date) { toast.error('End date must be after start date'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/my/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Leave request submitted!')
      setShowForm(false)
      setForm({ type: 'annual', from_date: '', to_date: '', reason: '' })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Leave Requests" subtitle="Apply and track your leave" />

      <div className="p-4 pb-28 lg:p-6 lg:pb-8 max-w-2xl mx-auto space-y-5">

        {/* iOS back + action */}
        <div className="flex items-center justify-between">
          <Link href="/workshop/attendance" className="flex items-center gap-0.5 text-brand font-medium active:opacity-50 -ml-1">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-[15px]">Attendance</span>
          </Link>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-black active:opacity-80 transition-opacity"
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? 'Cancel' : 'New Request'}
          </button>
        </div>

        {/* Leave types summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LEAVE_TYPES.map(lt => {
            const count = requests.filter(r => r.type === lt.value).length
            return (
              <div key={lt.value} className={`rounded-2xl p-3 ${lt.bg} border border-transparent`}>
                <p className={`text-2xl font-bold ${lt.color}`}>{count}</p>
                <p className="text-xs font-semibold text-gray-600 dark:text-white/50 mt-0.5">{lt.label}</p>
              </div>
            )
          })}
        </div>

        {/* New request form */}
        {showForm && (
          <div className="card space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">New Leave Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label mb-1">Leave Type</label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as LeaveType }))}
                    className="input-base w-full appearance-none pr-8"
                  >
                    {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1">From Date</label>
                  <input type="date" min={today} value={form.from_date}
                    onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
                    className="input-base w-full" required />
                </div>
                <div>
                  <label className="label mb-1">To Date</label>
                  <input type="date" min={form.from_date || today} value={form.to_date}
                    onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                    className="input-base w-full" required />
                </div>
              </div>
              {form.from_date && form.to_date && form.to_date >= form.from_date && (
                <p className="text-xs text-brand font-semibold">
                  {diffDays(form.from_date, form.to_date)} day{diffDays(form.from_date, form.to_date) !== 1 ? 's' : ''} requested
                </p>
              )}
              <div>
                <label className="label mb-1">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Brief reason for leave..." rows={3}
                  className="input-base w-full resize-none" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Check className="h-4 w-4" /> Submit Request</>}
              </button>
            </form>
          </div>
        )}

        {/* Requests list */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-3">My Requests</p>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-8 text-center">
              <CalendarDays className="h-8 w-8 text-gray-200 dark:text-white/10 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-white/30">No leave requests yet</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-brand font-semibold hover:underline">
                Submit your first request →
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
              {requests.map(req => {
                const lt = LEAVE_TYPES.find(l => l.value === req.type)
                return (
                  <div key={req.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${lt?.bg ?? ''} ${lt?.color ?? ''}`}>
                          {lt?.label ?? req.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLE[req.status]}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/30 shrink-0">
                        <Clock className="h-3 w-3" />
                        {diffDays(req.from_date, req.to_date)}d
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {fmtDate(req.from_date)} – {fmtDate(req.to_date)}
                    </p>
                    {req.reason && <p className="text-xs text-gray-500 dark:text-white/40">{req.reason}</p>}
                    {req.admin_note && (
                      <p className="text-xs text-brand font-medium bg-brand/5 rounded-lg px-3 py-2">
                        Manager: {req.admin_note}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
