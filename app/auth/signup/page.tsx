'use client'

import { useState, useTransition, useEffect } from 'react'
import { signIn } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Zap, User, Lock, Mail, AtSign, ShieldCheck } from 'lucide-react'

const ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'technician', label: 'Technician' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
]

export default function SignUpPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '', confirm: '', role: 'receptionist',
  })

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then(r => r.json())
      .then(d => {
        setNeedsSetup(d.needsSetup)
        if (d.needsSetup) setForm(f => ({ ...f, role: 'admin' }))
      })
      .catch(() => setNeedsSetup(false))
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          username: form.username,
          password: form.password,
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create account')
        return
      }
      toast.success('Account created! Signing you in…')
      const login = await signIn.email({
        email: form.email,
        password: form.password,
        callbackURL: '/workshop/dashboard',
      })
      if (login.error) {
        toast.error('Account created but sign-in failed — please log in manually')
        router.push('/auth/login')
      } else {
        router.push('/workshop/dashboard')
        router.refresh()
      }
    })
  }

  if (needsSetup === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-surface-900">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,127,10,0.12),transparent)]" />

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
            {needsSetup ? <ShieldCheck className="h-7 w-7 text-brand" /> : <Zap className="h-7 w-7 text-brand" />}
          </div>
          <h1 className="font-display text-3xl tracking-wide text-gray-900 dark:text-white">Bakkah</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/40">
            {needsSetup ? 'First-time setup — create your admin account' : 'Create your account'}
          </p>
        </div>

        {needsSetup && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>No users found. This account will be created as <strong>Admin</strong>.</span>
          </div>
        )}

        <div className="card border-gray-200 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-surface-800/80">
          <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
            {needsSetup ? 'Create Admin Account' : 'Sign up'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <input
                  type="text" required autoFocus
                  value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ahmed Al Mansoori"
                  className="input-base pl-9"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <input
                  type="email" required
                  value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@bakkahgarage.com"
                  className="input-base pl-9"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <input
                  type="text" required
                  value={form.username} onChange={e => set('username', e.target.value.replace(/\s/g, '').toLowerCase())}
                  placeholder="ahmed123"
                  className="input-base pl-9"
                />
              </div>
            </div>

            {/* Role — hidden in setup mode (forced to admin) */}
            {!needsSetup && (
              <div>
                <label className="label">Role</label>
                <select
                  value={form.role} onChange={e => set('role', e.target.value)}
                  className="input-base"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value} className="dark:bg-surface-800">{r.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <input
                  type={showPw ? 'text' : 'password'} required minLength={6}
                  value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min 6 characters"
                  className="input-base pl-9 pr-10"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:text-white/30 dark:hover:text-white/60">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <input
                  type={showConfirm ? 'text' : 'password'} required
                  value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  placeholder="Re-enter password"
                  className="input-base pl-9 pr-10"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:text-white/30 dark:hover:text-white/60">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isPending} className="btn-primary w-full py-3">
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> {needsSetup ? 'Creating admin…' : 'Creating account…'}</>
                : needsSetup ? 'Create Admin Account' : 'Create Account'
              }
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-white/40">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand hover:text-brand/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-white/20">
          Bakkah · Al Qusais, Dubai, UAE
        </p>
      </div>
    </div>
  )
}
