'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, User, Building2, Lock, Loader2, Check, Eye, EyeOff, Shield, AlertCircle, CheckCircle2, ExternalLink, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [rtaConfig, setRtaConfig] = useState<{ moi_configured: boolean; dubai_police_configured: boolean; rta_configured: boolean } | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined
  const role = user?.role ?? ''
  const isTechnician = role === 'technician'

  useEffect(() => {
    if (!isTechnician) {
      fetch('/api/rta/config').then(r => r.json()).then(setRtaConfig).catch(() => {})
    }
  }, [isTechnician])

  function setPw(k: string, v: string) { setPwForm(f => ({ ...f, [k]: v })) }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { toast.error('New passwords do not match'); return }
    if (pwForm.next.length < 6) { toast.error('New password must be at least 6 characters'); return }
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error || 'Failed to change password'); return }
        toast.success('Password changed successfully')
        setPwSuccess(true)
        setPwForm({ current: '', next: '', confirm: '' })
        setTimeout(() => setPwSuccess(false), 3000)
      } catch { toast.error('Failed to change password') }
    })
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
      router.push('/auth/login')
    } catch {
      toast.error('Logout failed')
      setLoggingOut(false)
    }
  }

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Settings" subtitle="Account & preferences" />

      <div className="mx-auto max-w-2xl p-4 pb-28 space-y-5 lg:p-6 lg:pb-8">

        {/* Appearance */}
        <div className="card">
          <SectionHeader icon={Sun} title="Appearance" subtitle="Choose your preferred interface theme" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => theme === 'dark' && toggle()}
              className={`flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${theme === 'light' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/20'}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Sun className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Light</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Bright &amp; clean</p>
              </div>
              {theme === 'light' && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand"><Check className="h-3 w-3 text-black" /></div>}
            </button>
            <button
              onClick={() => theme === 'light' && toggle()}
              className={`flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${theme === 'dark' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/20'}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
                <Moon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Dark</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Easy on the eyes</p>
              </div>
              {theme === 'dark' && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand"><Check className="h-3 w-3 text-black" /></div>}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-white/30 text-center">Current: <span className="font-semibold text-brand capitalize">{theme}</span> · Saved in browser</p>
        </div>

        {/* Account — hidden for technicians */}
        {!isTechnician && (
          <div className="card">
            <SectionHeader icon={User} title="Account" subtitle="Your account details" />
            <div className="space-y-3">
              {[
                { label: 'Full Name', value: user?.name ?? '—' },
                { label: 'Email Address', value: user?.email ?? '—' },
                { label: 'Role', value: user?.role ?? 'admin', badge: true },
              ].map(({ label, value, badge }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="text-sm text-gray-500 dark:text-white/40">{label}</span>
                  {badge
                    ? <span className="rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold capitalize text-brand">{value}</span>
                    : <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="card">
          <SectionHeader icon={Lock} title="Change Password" subtitle="Update your account password" />
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { key: 'current', label: 'Current Password', show: showCurrent, toggle: () => setShowCurrent(p => !p), placeholder: 'Enter current password' },
              { key: 'next', label: 'New Password', show: showNext, toggle: () => setShowNext(p => !p), placeholder: 'Min 6 characters' },
              { key: 'confirm', label: 'Confirm New Password', show: showConfirm, toggle: () => setShowConfirm(p => !p), placeholder: 'Re-enter new password' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <div className="relative">
                  <input type={f.show ? 'text' : 'password'} required value={pwForm[f.key as keyof typeof pwForm]}
                    onChange={e => setPw(f.key, e.target.value)} placeholder={f.placeholder} className="input-base pr-10" />
                  <button type="button" onClick={f.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60">
                    {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                : pwSuccess ? <><Check className="h-4 w-4" /> Password Changed!</>
                  : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Workshop Info — hidden for technicians */}
        {!isTechnician && (
          <div className="card">
            <SectionHeader icon={Building2} title="Workshop Info" subtitle="Business details" />
            <div className="space-y-3">
              {[
                { label: 'Workshop Name', value: 'Bakkah' },
                { label: 'Location', value: 'Al Qusais, Dubai, UAE' },
                { label: 'TRN', value: '100 123 456 700 003' },
                { label: 'Phone', value: '+971 4 123 4567' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="text-sm text-gray-500 dark:text-white/40">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UAE RTA Integration — admin only */}
        {role === 'admin' && (
          <div className="card">
            <SectionHeader icon={Shield} title="UAE RTA Integration" subtitle="Connect to government APIs" />
            <div className="space-y-3 mb-5">
              {[
                { key: 'moi_configured' as const, name: 'MOI Smart Services', desc: 'Federal traffic fines', url: 'https://smartservices.moi.gov.ae/developer' },
                { key: 'dubai_police_configured' as const, name: 'Dubai Police API', desc: 'Dubai traffic fines (OAuth2)', url: 'https://smart.dubaipolice.gov.ae/developer' },
                { key: 'rta_configured' as const, name: 'RTA Smart Integration', desc: 'Mulkiya, insurance, Salik balance', url: 'https://gateway.rta.ae/' },
              ].map(src => {
                const configured = rtaConfig?.[src.key] ?? false
                return (
                  <div key={src.key} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    {configured ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{src.name}</p>
                      <p className="text-xs text-gray-500 dark:text-white/40">{src.desc}</p>
                    </div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-brand transition-colors dark:text-white/20">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )
              })}
            </div>
            <Link href="/workshop/rta-guide" className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
              View full RTA API guide <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Sign Out</p>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">You'll be redirected to the login screen</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-500/15 active:bg-red-100 transition-colors disabled:opacity-50"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
