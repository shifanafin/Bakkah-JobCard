'use client'

import { Suspense, useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Zap, User, Lock } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ login: '', password: '' })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const res = await signIn('credentials', {
        login: form.login.trim(),
        password: form.password,
        redirect: false,
      })
      if (res?.error) {
        toast.error('Invalid credentials — check your email/username and password')
      } else {
        toast.success('Welcome back!')
        router.push(params.get('callbackUrl') || '/workshop/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="card border-gray-200 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-surface-800/80">
      <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Sign in to your account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email or Username */}
        <div>
          <label className="label">Email or Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              placeholder="admin@autoedgepro.ae or admin"
              className="input-base pl-9"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="label">Password</label>
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
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
            : 'Sign In'
          }
        </button>
      </form>

      {/* Demo credentials */}
      {/* <div className="mt-5 space-y-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">Demo credentials</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-gray-400 dark:text-white/30">Email</span>
          <span className="font-mono text-gray-600 dark:text-white/60">admin@autoedgepro.ae</span>
          <span className="text-gray-400 dark:text-white/30">Username</span>
          <span className="font-mono text-gray-600 dark:text-white/60">admin</span>
          <span className="text-gray-400 dark:text-white/30">Password</span>
          <span className="font-mono text-gray-600 dark:text-white/60">admin123</span>
        </div>
      </div> */}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-surface-900">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,127,10,0.12),transparent)]" />

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
            <Zap className="h-7 w-7 text-brand" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-gray-900 dark:text-white">AutoEdge Pro</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/40">Workshop Management System</p>
        </div>

        <Suspense fallback={<div className="card border-gray-200 bg-white/80 dark:border-white/[0.08] dark:bg-surface-800/80 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        {/* Signup link — hidden */}
        <p className="hidden mt-5 text-center text-sm text-gray-500 dark:text-white/40">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-brand transition-colors hover:text-brand/80">
            Create one
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-white/20">
          AutoEdge Pro · Al Qusais, Dubai, UAE
        </p>
      </div>
    </div>
  )
}
