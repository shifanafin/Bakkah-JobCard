'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Users, Plus, Loader2, X, Check, RefreshCw, Key, ToggleLeft, ToggleRight, Copy } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 15
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'

type Employee = {
  id: string
  name: string
  email: string
  username: string
  role: string
  active: boolean
  created_at: string
}

type NewEmployeeForm = {
  name: string
  email: string
  username: string
  role: string
  password: string
}

const ROLES = ['admin', 'supervisor', 'manager', 'receptionist', 'technician']
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400',
  supervisor: 'bg-amber-500/15 text-amber-400',
  manager: 'bg-purple-500/15 text-purple-400',
  receptionist: 'bg-blue-500/15 text-blue-400',
  technician: 'bg-brand/15 text-brand',
}

const EMPTY_FORM: NewEmployeeForm = {
  name: '', email: '', username: '', role: 'receptionist', password: '',
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function EmployeesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewEmployeeForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ username: string; password: string } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<Employee | null>(null)
  const [resetPwd, setResetPwd] = useState('')
  const [resetting, setResetting] = useState(false)
  const [page, setPage] = useState(1)

  const paginated = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Role guard
  useEffect(() => {
    if (status === 'authenticated' && role !== 'admin') {
      router.replace('/workshop/dashboard')
    }
  }, [status, role, router])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/employees')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEmployees(json.users ?? [])
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (role === 'admin') load() }, [role, load])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name || !form.email || !form.username || !form.password) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setShowModal(false)
      setSuccessInfo({ username: form.username, password: form.password })
      setForm(EMPTY_FORM)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(emp: Employee) {
    setTogglingId(emp.id)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, action: 'toggle_active' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: json.active } : e))
      toast.success(`Employee ${json.active ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resetTarget || !resetPwd) return
    setResetting(true)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetTarget.id, action: 'reset_password', password: resetPwd }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Password reset successfully')
      setResetTarget(null)
      setResetPwd('')
    } catch {
      toast.error('Failed to reset password')
    } finally {
      setResetting(false)
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
      <Header title="Employees" subtitle="Manage workshop staff" />

      <div className="p-4 space-y-5 max-w-6xl lg:p-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-white/40">{employees.length} employees</p>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs px-3 py-2 h-auto">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Employee
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : employees.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
            <p className="text-sm text-gray-400 dark:text-white/30">No employees yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Email / Username</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Role</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Joined</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {paginated.map(emp => (
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
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                        emp.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400'
                      )}>
                        {emp.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-white/30 text-xs">
                      {formatDate(emp.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggle(emp)}
                          disabled={togglingId === emp.id}
                          title={emp.active ? 'Deactivate' : 'Activate'}
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg border transition-colors disabled:opacity-50',
                            emp.active
                              ? 'border-emerald-300 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10'
                              : 'border-gray-200 text-gray-400 hover:bg-gray-50 dark:border-white/[0.08] dark:text-white/30'
                          )}
                        >
                          {togglingId === emp.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : emp.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => { setResetTarget(emp); setResetPwd(generatePassword()) }}
                          title="Reset Password"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors dark:border-white/[0.08] dark:text-white/30"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {employees.length > PAGE_SIZE && (
          <Pagination page={page} totalItems={employees.length} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Add New Employee</h2>
              <button onClick={() => setShowModal(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition dark:text-white/30 dark:hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label mb-1">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-base w-full"
                  placeholder="Ahmed Al Rashid"
                  required
                />
              </div>
              <div>
                <label className="label mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-base w-full"
                  placeholder="ahmed@autoedgepro.ae"
                  required
                />
              </div>
              <div>
                <label className="label mb-1">Username *</label>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                  className="input-base w-full font-mono"
                  placeholder="ahmed.rashid"
                  required
                />
              </div>
              <div>
                <label className="label mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="input-base w-full"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1">Temporary Password *</label>
                <div className="flex gap-2">
                  <input
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-base w-full font-mono"
                    placeholder="Temp password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                    className="btn-ghost px-3 py-2 h-auto text-xs whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-6 w-6 text-emerald-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Employee Created</h2>
              <p className="text-sm text-gray-500 dark:text-white/50 mb-4">Share these credentials with the new employee</p>
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
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Username: ${successInfo.username}\nPassword: ${successInfo.password}`)
                    toast.success('Copied to clipboard')
                  }}
                  className="btn-ghost flex-1 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <button onClick={() => setSuccessInfo(null)} className="btn-primary flex-1 text-xs">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-surface-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Reset Password</h2>
              <button onClick={() => setResetTarget(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition dark:text-white/30 dark:hover:bg-white/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-white/50">
                Reset password for <strong className="text-gray-900 dark:text-white">{resetTarget.name}</strong>
              </p>
              <div>
                <label className="label mb-1">New Password *</label>
                <div className="flex gap-2">
                  <input
                    value={resetPwd}
                    onChange={e => setResetPwd(e.target.value)}
                    className="input-base w-full font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setResetPwd(generatePassword())}
                    className="btn-ghost px-3 py-2 h-auto text-xs whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setResetTarget(null)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={resetting} className="btn-primary flex-1">
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
