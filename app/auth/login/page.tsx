'use client'

import { Suspense, useState, useTransition, useEffect } from 'react'
import { signIn, authClient } from '@/lib/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Zap, User, Lock, ShieldCheck } from 'lucide-react'
import { useT } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ login: '', password: '' })
  const { t } = useT()
  const a = t.auth

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      // Detect login type: contains "@" → email, else → username
      const login = form.login.trim()
      const isEmail = login.includes('@')

      let error: string | null = null
      if (isEmail) {
        const res = await signIn.email({
          email: login,
          password: form.password,
          callbackURL: params.get('callbackUrl') || '/workshop/dashboard',
        })
        error = res.error?.message ?? null
      } else {
        const res = await authClient.signIn.username({
          username: login,
          password: form.password,
          callbackURL: params.get('callbackUrl') || '/workshop/dashboard',
        })
        error = res.error?.message ?? null
      }

      if (error) {
        toast.error(a.errors.invalid)
      } else {
        toast.success(a.errors.welcome)
        router.push(params.get('callbackUrl') || '/workshop/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="card border-gray-200 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-surface-800/80">
      <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">{a.signInTitle}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{a.emailOrUsername}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              placeholder="admin@bakkahgarage.com or admin"
              className="input-base pl-9"
            />
          </div>
        </div>

        <div>
          <label className="label">{a.password}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input-base pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:text-white/30 dark:hover:text-white/60"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full py-3">
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {a.signingIn}</>
            : a.signIn
          }
        </button>
      </form>
    </div>
  )
}

function SetupBanner() {
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then(r => r.json())
      .then(d => setNeedsSetup(d.needsSetup))
      .catch(() => {})
  }, [])

  if (!needsSetup) return null

  return (
    <Link href="/auth/signup"
      className="mb-4 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand hover:bg-brand/15 transition-colors">
      <ShieldCheck className="h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">First-time setup</p>
        <p className="text-xs opacity-70">No users found — click here to create your admin account</p>
      </div>
    </Link>
  )
}

export default function LoginPage() {
  const { t } = useT()
  const a = t.auth

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-surface-900">

      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,127,10,0.12),transparent)]" />

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Language switcher */}
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher variant="app" />
        </div>

        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
            <Zap className="h-7 w-7 text-brand" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-gray-900 dark:text-white">{a.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/40">{a.subtitle}</p>
        </div>

        <SetupBanner />

        <Suspense fallback={<div className="card border-gray-200 bg-white/80 dark:border-white/[0.08] dark:bg-surface-800/80 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-white/20">
          {a.footer}
        </p>
      </div>
    </div>
  )
}
