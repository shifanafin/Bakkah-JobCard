'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import {
  Users, Clock, CalendarOff, Lightbulb, AlertCircle,
  Loader2, Plus, RefreshCw, Key, ToggleLeft, ToggleRight,
  LogIn, LogOut, UserCheck, UserX, CheckCircle, BarChart2,
  Check, X, Copy, Trash2, Wrench, Phone, Edit2, Briefcase, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SwipeToDelete from '@/components/ui/SwipeToDelete'

// ── Types ────────────────────────────────────────────────────────────────────

type Employee = {
  id: string; name: string; email: string; username: string
  role: string; active: boolean; created_at: string
}

type AttRow = {
  id: string; name: string; role: string; active: boolean
  attendance: { id: string; checkin_at: string; checkout_at: string | null } | null
  jobs_closed_today: number; active_jobs: number; total_jobs: number
}

type LeaveRequest = {
  id: string; user_id: string; user_name: string; type: string
  from_date: string; to_date: string; reason: string | null
  status: 'pending' | 'approved' | 'rejected'; admin_note: string | null
  created_at: string
}

type FeedbackItem = {
  id: string; user_id: string; user_name: string; type: 'suggestion' | 'complaint'
  subject: string; body: string
  status: 'open' | 'reviewed' | 'resolved'; admin_note: string | null
  created_at: string
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

// ── Constants ────────────────────────────────────────────────────────────────

const SPECIALTIES = ['Technician', 'Inspector', 'Detailer', 'Body Technician', 'Painter', 'Electrician']

const SPECIALTY_COLORS: Record<string, string> = {
  'Technician': 'bg-brand/15 text-brand',
  'Inspector': 'bg-blue-500/15 text-blue-400',
  'Detailer': 'bg-purple-500/15 text-purple-400',
  'Body Technician': 'bg-golden/15 text-golden',
  'Painter': 'bg-pink-500/15 text-pink-400',
  'Electrician': 'bg-yellow-500/15 text-yellow-400',
}

const ROLES = ['admin', 'supervisor', 'receptionist', 'technician']
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400',
  supervisor: 'bg-amber-500/15 text-amber-400',
  receptionist: 'bg-blue-500/15 text-blue-400',
  technician: 'bg-brand/15 text-brand',
}
const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual', sick: 'Sick', emergency: 'Emergency', unpaid: 'Unpaid',
}
const LEAVE_STATUS_COLORS = {
  pending: 'bg-amber-500/15 text-amber-500',
  approved: 'bg-emerald-500/15 text-emerald-500',
  rejected: 'bg-red-500/15 text-red-400',
}
const FEEDBACK_STATUS_COLORS = {
  open: 'bg-amber-500/15 text-amber-500',
  reviewed: 'bg-blue-500/15 text-blue-400',
  resolved: 'bg-emerald-500/15 text-emerald-500',
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function hoursWorked(checkin: string, checkout: string | null) {
  const end = checkout ? new Date(checkout) : new Date()
  const diff = Math.max(0, end.getTime() - new Date(checkin).getTime())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m`
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'employees' | 'technicians' | 'attendance' | 'leave' | 'suggestions' | 'complaints'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'technicians', label: 'Technicians', icon: Wrench },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave', icon: CalendarOff },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
  { id: 'complaints', label: 'Complaints', icon: AlertCircle },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HRPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [tab, setTab] = useState<Tab>('employees')

  useEffect(() => {
    if (!isPending && session && role !== 'admin' && role !== 'supervisor') {
      router.replace('/workshop/dashboard')
    }
  }, [isPending, role, router, session])

  if (isPending || (!isPending && session && role !== 'admin' && role !== 'supervisor')) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="People & HR" subtitle="Employees, attendance, leave and feedback" />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 dark:border-white/[0.07] dark:bg-surface-800 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap',
                tab === t.id
                  ? 'bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/70'
              )}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {tab === 'employees' && <EmployeesTab isAdmin={role === 'admin'} />}
        {tab === 'technicians' && <TechniciansTab />}
        {tab === 'attendance' && <AttendanceTab />}
        {tab === 'leave' && <LeaveTab />}
        {tab === 'suggestions' && <FeedbackTab type="suggestion" />}
        {tab === 'complaints' && <FeedbackTab type="complaint" />}
      </div>
    </div>
  )
}

// ── Employees Tab ─────────────────────────────────────────────────────────────

function EmployeesTab({ isAdmin }: { isAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', username: '', role: 'receptionist', password: '' })
  const [saving, setSaving] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ username: string; password: string } | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<Employee | null>(null)
  const [resetPwd, setResetPwd] = useState('')
  const [resetting, setResetting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/employees')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEmployees(json.users ?? [])
    } catch { toast.error('Failed to load employees') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = employees.filter(e => filter === 'all' || e.role === filter)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name || !form.email || !form.username || !form.password) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setShowModal(false)
      setSuccessInfo({ username: form.username, password: form.password })
      setForm({ name: '', email: '', username: '', role: 'receptionist', password: '' })
      await load()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  async function handleToggle(emp: Employee) {
    setTogglingId(emp.id)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, action: 'toggle_active' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: json.active } : e))
      toast.success(`Employee ${json.active ? 'activated' : 'deactivated'}`)
    } catch { toast.error('Failed to update status') }
    finally { setTogglingId(null) }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resetTarget || !resetPwd) return
    setResetting(true)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetTarget.id, action: 'reset_password', password: resetPwd }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Password reset')
      setResetTarget(null); setResetPwd('')
    } catch { toast.error('Failed to reset password') }
    finally { setResetting(false) }
  }

  async function handleDelete(emp: Employee) {
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEmployees(prev => prev.filter(e => e.id !== emp.id))
      setDeleteTarget(null)
      toast.success(`${emp.name} deleted`)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setDeleting(false) }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Role filter */}
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...ROLES].map(r => (
            <button key={r} onClick={() => setFilter(r)}
              className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors capitalize',
                filter === r ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.10]'
              )}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto"><RefreshCw className="h-3.5 w-3.5" /></button>
          {isAdmin && (
            <button onClick={() => { setForm({ name: '', email: '', username: '', role: 'receptionist', password: '' }); setShowModal(true) }} className="btn-primary text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Employee
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <Users className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
          <p className="text-sm text-gray-400 dark:text-white/30">No employees</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  {['Name', 'Email / Username', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-xs">
                          {emp.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-white/70">{emp.email}</p>
                      <p className="text-xs font-mono text-gray-400 dark:text-white/30">@{emp.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', ROLE_COLORS[emp.role] ?? 'bg-gray-100 text-gray-500')}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', emp.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400')}>
                        {emp.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-white/30">{formatDate(emp.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleToggle(emp)} disabled={togglingId === emp.id} title={emp.active ? 'Deactivate' : 'Activate'}
                          className={cn('flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-50',
                            emp.active ? 'border-emerald-300 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10'
                              : 'border-gray-200 text-gray-400 hover:bg-gray-50 dark:border-white/[0.08] dark:text-white/30')}>
                          {togglingId === emp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : emp.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setResetTarget(emp); setResetPwd(generatePassword()) }} title="Reset Password"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors dark:border-white/[0.08] dark:text-white/30">
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteTarget(emp)} title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors dark:border-white/[0.08] dark:text-white/30">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — swipe-to-delete */}
          <div className="md:hidden space-y-2">
            {filtered.map(emp => (
              <SwipeToDelete
                key={emp.id}
                onDelete={() => setDeleteTarget(emp)}
                disabled={!isAdmin}
                disabledReason={!isAdmin ? 'Only admins can delete employees' : undefined}
              >
                <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-sm">{emp.name[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{emp.name}</p>
                        <p className="text-xs font-mono text-gray-400 dark:text-white/30 truncate">@{emp.username}</p>
                      </div>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', ROLE_COLORS[emp.role] ?? 'bg-gray-100 text-gray-500')}>{emp.role}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50 truncate">{emp.email}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', emp.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400')}>
                        {emp.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-white/30">{formatDate(emp.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleToggle(emp)} disabled={togglingId === emp.id}
                        className={cn('flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-50',
                          emp.active ? 'border-emerald-300 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10'
                            : 'border-gray-200 text-gray-400 hover:bg-gray-50 dark:border-white/[0.08] dark:text-white/30')}>
                        {togglingId === emp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : emp.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => { setResetTarget(emp); setResetPwd(generatePassword()) }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors dark:border-white/[0.08] dark:text-white/30">
                        <Key className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </SwipeToDelete>
            ))}
          </div>
        </>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee?"
        message={`Delete "${deleteTarget?.name}"?`}
        detail="This permanently removes the account. Cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Add New Employee</h2>
              <button onClick={() => setShowModal(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:text-white/30 dark:hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[
                { label: 'Full Name', field: 'name', placeholder: 'Ahmed Al Rashid', type: 'text' },
                { label: 'Email', field: 'email', placeholder: 'ahmed@bakkah.com', type: 'email' },
                { label: 'Username', field: 'username', placeholder: 'ahmed.rashid', type: 'text' },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="label mb-1">{label} *</label>
                  <input type={type} value={(form as Record<string, string>)[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: field === 'username' ? e.target.value.toLowerCase().replace(/\s/g, '') : e.target.value }))}
                    className="input-base w-full" placeholder={placeholder} required />
                </div>
              ))}
              <div>
                <label className="label mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-base w-full">
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1">Temporary Password *</label>
                <div className="flex gap-2">
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-base w-full font-mono" placeholder="Min 8 chars" required />
                  <button type="button" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} className="btn-ghost px-3 py-2 h-auto text-xs whitespace-nowrap">Generate</button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success modal */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800 p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Employee Created</h2>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-4">Share these credentials</p>
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] p-4 text-left space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-white/30">Username</span>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{successInfo.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-white/30">Password</span>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{successInfo.password}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(`Username: ${successInfo.username}\nPassword: ${successInfo.password}`); toast.success('Copied') }} className="btn-ghost flex-1 text-xs">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button onClick={() => setSuccessInfo(null)} className="btn-primary flex-1 text-xs">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Reset Password</h2>
              <button onClick={() => setResetTarget(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:text-white/30 dark:hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-white/50">
                Reset password for <strong className="text-gray-900 dark:text-white">{resetTarget.name}</strong>
              </p>
              <div>
                <label className="label mb-1">New Password *</label>
                <div className="flex gap-2">
                  <input value={resetPwd} onChange={e => setResetPwd(e.target.value)} className="input-base w-full font-mono" required />
                  <button type="button" onClick={() => setResetPwd(generatePassword())} className="btn-ghost px-3 py-2 h-auto text-xs whitespace-nowrap">Generate</button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setResetTarget(null)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={resetting} className="btn-primary flex-1">
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ── Technicians Tab ─────────────────────────────────────────────────────────

function TechniciansTab() {
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

  // Portal mount guard (avoid SSR mismatch)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Attendance action loading state (keyed by userId)
  const [attLoading, setAttLoading] = useState<string | null>(null)

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

  useEffect(() => { load() }, [load])

  // ── Edit ─────────────────────────────────────────────────────────────────
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

  // ── Create ───────────────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────
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

  // ── Attendance overrides ─────────────────────────────────────────────────
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

  const inputCls = 'input-base w-full'

  return (
    <>
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
            Add First Technician →
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
                  const checkedIn = att && !att.checkout_at
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
                              <span className="text-xs text-gray-500 dark:text-white/40">{formatTime(att!.checkin_at)} – {formatTime(att!.checkout_at!)}</span>
                              <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 font-medium">Done</span>
                            </div>
                          ) : checkedIn ? (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                In since {formatTime(att!.checkin_at)}
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

          {/* Mobile card list — swipe-to-delete, tap to edit */}
          <div className="md:hidden space-y-2">
            {technicians.map(tech => {
              const att = tech.today_attendance
              const checkedIn = att && !att.checkout_at
              const checkedOut = att && att.checkout_at
              const isActioning = attLoading === tech.id
              return (
                <SwipeToDelete key={tech.id} onDelete={() => setDeleteTarget(tech)}>
                  <div
                    className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 p-4 space-y-3 cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.02] transition-colors"
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

                    {/* Row 3: attendance */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs">
                        {checkedOut ? (
                          <span className="text-gray-500 dark:text-white/40">{formatTime(att!.checkin_at)} – {formatTime(att!.checkout_at!)}</span>
                        ) : checkedIn ? (
                          <span className="flex items-center gap-1 text-emerald-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In since {formatTime(att!.checkin_at)}
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
                      </div>
                    </div>
                  </div>
                </SwipeToDelete>
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

      {/* ── Create Technician Modal ── */}
      {mounted && showCreate && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-surface-800 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]">
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
        , document.body)}

      {/* ── Edit Modal ── */}
      {mounted && editTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-surface-800 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]">
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
        , document.body)}

      {/* ── Delete Confirm Modal ── */}
      {mounted && deleteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
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
        , document.body)}
    </>
  )
}

// ── Attendance Tab ────────────────────────────────────────────────────────────

function AttendanceTab() {
  const [records, setRecords] = useState<AttRow[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attLoading, setAttLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?date=${date}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRecords(json.records ?? [])
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }, [date])

  useEffect(() => { load() }, [load])

  const isToday = date === new Date().toISOString().split('T')[0]
  const checkedIn = records.filter(r => r.attendance?.checkin_at && !r.attendance?.checkout_at)
  const checkedOut = records.filter(r => r.attendance?.checkout_at)
  const absent = records.filter(r => !r.attendance)

  async function handleCheckIn(r: AttRow) {
    setAttLoading(r.id)
    try {
      const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ forUserId: r.id }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${r.name} checked in`)
      await load()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setAttLoading(null) }
  }

  async function handleCheckOut(r: AttRow) {
    setAttLoading(r.id)
    try {
      const res = await fetch('/api/attendance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ forUserId: r.id }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`${r.name} checked out`)
      await load()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setAttLoading(null) }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <input type="date" value={date} max={new Date().toISOString().split('T')[0]}
          onChange={e => setDate(e.target.value)} className="input-base text-sm px-3 py-2 h-auto" />
        <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto"><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Checked In', value: checkedIn.length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Checked Out', value: checkedOut.length, icon: LogOut, color: 'text-gray-400', bg: 'bg-gray-500/10' },
          { label: 'Absent', value: absent.length, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Jobs Closed Today', value: records.reduce((s, r) => s + r.jobs_closed_today, 0), icon: CheckCircle, color: 'text-brand', bg: 'bg-brand/10' },
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

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : records.length === 0 ? (
        <div className="card flex flex-col items-center py-16"><Clock className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" /><p className="text-sm text-gray-400">No staff records</p></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  {['Staff', 'Role', 'Check-in', 'Check-out', 'Hours', 'Closed', 'Active', 'Total', ...(isToday ? ['Action'] : [])].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {records.map(r => {
                  const att = r.attendance
                  const isIn = att && !att.checkout_at
                  const isOut = att && att.checkout_at
                  const busy = attLoading === r.id
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-xs">{r.name[0]?.toUpperCase()}</div>
                            {isIn && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-surface-800" />}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', ROLE_COLORS[r.role] ?? 'bg-gray-100 text-gray-500')}>{r.role}</span>
                      </td>
                      <td className="px-4 py-3">{att ? <span className="flex items-center gap-1.5 text-emerald-500 font-medium"><LogIn className="h-3.5 w-3.5" />{formatTime(att.checkin_at)}</span> : <span className="text-xs text-gray-400 italic">—</span>}</td>
                      <td className="px-4 py-3">{isOut ? <span className="flex items-center gap-1.5 text-gray-500 dark:text-white/50"><LogOut className="h-3.5 w-3.5" />{formatTime(att!.checkout_at!)}</span> : isIn ? <span className="text-xs text-emerald-400">Still in</span> : <span className="text-xs text-gray-400">—</span>}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-white/60">{att ? hoursWorked(att.checkin_at, att.checkout_at) : '—'}</td>
                      <td className="px-4 py-3"><span className={cn('font-bold text-sm', r.jobs_closed_today > 0 ? 'text-emerald-500' : 'text-gray-400 dark:text-white/25')}>{r.jobs_closed_today}</span></td>
                      <td className="px-4 py-3"><span className={cn('font-bold text-sm', r.active_jobs > 0 ? 'text-brand' : 'text-gray-400 dark:text-white/25')}>{r.active_jobs}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><BarChart2 className="h-3.5 w-3.5 text-gray-400" /><span className="font-medium text-gray-700 dark:text-white/70">{r.total_jobs}</span></div></td>
                      {isToday && (
                        <td className="px-4 py-3">
                          {isOut ? <span className="text-xs text-gray-400 italic">Done</span>
                            : isIn ? (
                              <button onClick={() => handleCheckOut(r)} disabled={busy} className="flex items-center gap-1 rounded-lg border border-orange-200 dark:border-orange-500/30 px-2.5 py-1 text-xs font-semibold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 disabled:opacity-50 whitespace-nowrap">
                                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />} Out
                              </button>
                            ) : (
                              <button onClick={() => handleCheckIn(r)} disabled={busy} className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50 whitespace-nowrap">
                                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />} In
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

          {/* Mobile */}
          <div className="md:hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800 divide-y divide-gray-100 dark:divide-white/[0.05]">
            {records.map(r => {
              const att = r.attendance
              const isIn = att && !att.checkout_at
              const isOut = att && att.checkout_at
              const busy = attLoading === r.id
              return (
                <div key={r.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-brand font-bold text-sm">{r.name[0]?.toUpperCase()}</div>
                        {isIn && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-surface-800" />}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{r.name}</span>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize', ROLE_COLORS[r.role] ?? 'bg-gray-100 text-gray-500')}>{r.role}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    {att ? (
                      <>
                        <span className="flex items-center gap-1 text-emerald-500 font-medium"><LogIn className="h-3 w-3" />{formatTime(att.checkin_at)}</span>
                        {isOut ? <span className="flex items-center gap-1 text-gray-500 dark:text-white/50"><LogOut className="h-3 w-3" />{formatTime(att.checkout_at!)}</span> : <span className="text-emerald-400 font-medium">Still in</span>}
                        <span className="font-mono text-gray-500 dark:text-white/40">{hoursWorked(att.checkin_at, att.checkout_at)}</span>
                      </>
                    ) : <span className="text-gray-400 italic">Not checked in</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/40">
                      <span>Closed: <span className={cn('font-bold', r.jobs_closed_today > 0 ? 'text-emerald-500' : 'text-gray-400')}>{r.jobs_closed_today}</span></span>
                      <span>Active: <span className={cn('font-bold', r.active_jobs > 0 ? 'text-brand' : 'text-gray-400')}>{r.active_jobs}</span></span>
                    </div>
                    {isToday && (
                      isOut ? <span className="text-xs text-gray-400 italic">Done</span>
                        : isIn ? (
                          <button onClick={() => handleCheckOut(r)} disabled={busy} className="flex items-center gap-1 rounded-lg border border-orange-200 dark:border-orange-500/30 px-2.5 py-1 text-xs font-semibold text-orange-500 disabled:opacity-50">
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />} Out
                          </button>
                        ) : (
                          <button onClick={() => handleCheckIn(r)} disabled={busy} className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 disabled:opacity-50">
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3 w-3" />} In
                          </button>
                        )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

// ── Leave Tab ─────────────────────────────────────────────────────────────────

function LeaveTab() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reviewTarget, setReviewTarget] = useState<{ request: LeaveRequest; action: 'approved' | 'rejected' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leave')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRequests(json.requests ?? [])
    } catch { toast.error('Failed to load leave requests') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = requests.filter(r => statusFilter === 'all' || r.status === statusFilter)

  async function handleReview() {
    if (!reviewTarget) return
    setReviewing(true)
    try {
      const res = await fetch('/api/admin/leave', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewTarget.request.id, status: reviewTarget.action, admin_note: adminNote }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRequests(prev => prev.map(r => r.id === json.request.id ? json.request : r))
      setReviewTarget(null); setAdminNote('')
      toast.success(`Leave request ${reviewTarget.action}`)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setReviewing(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/leave?id=${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRequests(prev => prev.filter(r => r.id !== deleteTarget.id))
      toast.success('Leave request deleted')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors capitalize',
                statusFilter === s ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.10]'
              )}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto"><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16">
          <CalendarOff className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
          <p className="text-sm text-gray-400">No leave requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{req.user_name}</span>
                    <span className="rounded-full bg-blue-500/15 text-blue-400 px-2 py-0.5 text-xs font-semibold capitalize">
                      {LEAVE_TYPE_LABELS[req.type] ?? req.type}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', LEAVE_STATUS_COLORS[req.status])}>
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-white/40">
                    {req.from_date} → {req.to_date}
                  </p>
                  {req.reason && <p className="mt-1 text-sm text-gray-600 dark:text-white/60">{req.reason}</p>}
                  {req.admin_note && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-white/30 italic">Admin note: {req.admin_note}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/25">{formatDate(req.created_at)}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setReviewTarget({ request: req, action: 'approved' }); setAdminNote('') }}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => { setReviewTarget({ request: req, action: 'rejected' }); setAdminNote('') }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white capitalize">
              {reviewTarget.action === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/50">
              <strong className="text-gray-900 dark:text-white">{reviewTarget.request.user_name}</strong>
              {' — '}{LEAVE_TYPE_LABELS[reviewTarget.request.type]} | {reviewTarget.request.from_date} → {reviewTarget.request.to_date}
            </p>
            <div>
              <label className="label mb-1">Admin Note (optional)</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                rows={3} className="input-base w-full resize-none" placeholder="Add a note visible to the employee…" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReviewTarget(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleReview} disabled={reviewing}
                className={cn('flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50',
                  reviewTarget.action === 'approved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                )}>
                {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : reviewTarget.action === 'approved' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {reviewTarget.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Feedback Tab (suggestions & complaints) ───────────────────────────────────

function FeedbackTab({ type }: { type: 'suggestion' | 'complaint' }) {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [detailTarget, setDetailTarget] = useState<FeedbackItem | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/employee-feedback?type=${type}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setItems(json.feedback ?? [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [type])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(i => statusFilter === 'all' || i.status === statusFilter)

  async function handleUpdateStatus() {
    if (!detailTarget || !newStatus) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/employee-feedback', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: detailTarget.id, status: newStatus, admin_note: adminNote }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setItems(prev => prev.map(i => i.id === json.feedback.id ? json.feedback : i))
      setDetailTarget(null)
      toast.success('Updated')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const Icon = type === 'suggestion' ? Lightbulb : AlertCircle
  const emptyLabel = type === 'suggestion' ? 'No suggestions' : 'No complaints'

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'open', 'reviewed', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors capitalize',
                statusFilter === s ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.10]'
              )}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto"><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16">
          <Icon className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
          <p className="text-sm text-gray-400">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="card space-y-2 cursor-pointer hover:ring-1 hover:ring-brand/20 transition-all"
              onClick={() => { setDetailTarget(item); setNewStatus(item.status); setAdminNote(item.admin_note ?? '') }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{item.subject}</span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize', FEEDBACK_STATUS_COLORS[item.status])}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-white/30">{item.user_name} · {formatDate(item.created_at)}</p>
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-white/60 line-clamp-2">{item.body}</p>
                  {item.admin_note && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-white/30 italic">Note: {item.admin_note}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail / update modal */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl dark:bg-surface-800 flex flex-col max-h-[88vh] sm:max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{detailTarget.subject}</h2>
                <p className="text-xs text-gray-400 dark:text-white/30">{detailTarget.user_name} · {formatDate(detailTarget.created_at)}</p>
              </div>
              <button onClick={() => setDetailTarget(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:text-white/30 dark:hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
              <p className="text-sm text-gray-700 dark:text-white/70 whitespace-pre-wrap">{detailTarget.body}</p>
              <div>
                <label className="label mb-1">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-base w-full">
                  <option value="open">Open</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="label mb-1">Admin Note (optional)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  rows={3} className="input-base w-full resize-none" placeholder="Add an internal note…" />
              </div>
            </div>
            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
              <button onClick={() => setDetailTarget(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleUpdateStatus} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
