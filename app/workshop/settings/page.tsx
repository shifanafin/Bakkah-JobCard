'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, User, Building2, Lock, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  function setPw(k: string, v: string) { setPwForm(f => ({ ...f, [k]: v })) }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (pwForm.next.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to change password')
          return
        }
        toast.success('Password changed successfully')
        setPwSuccess(true)
        setPwForm({ current: '', next: '', confirm: '' })
        setTimeout(() => setPwSuccess(false), 3000)
      } catch {
        toast.error('Failed to change password')
      }
    })
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

      <div className="mx-auto max-w-2xl p-4 space-y-5 lg:p-6">

        {/* Appearance */}
        <div className="card">
          <SectionHeader icon={Sun} title="Appearance" subtitle="Choose your preferred interface theme" />
          <div className="flex items-center gap-4">
            {/* Light mode card */}
            <button
              onClick={() => theme === 'dark' && toggle()}
              className={`flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                theme === 'light'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/20'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Sun className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Light</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Bright & clean</p>
              </div>
              {theme === 'light' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                  <Check className="h-3 w-3 text-black" />
                </div>
              )}
            </button>

            {/* Dark mode card */}
            <button
              onClick={() => theme === 'light' && toggle()}
              className={`flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                theme === 'dark'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/20'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
                <Moon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Dark</p>
                <p className="text-xs text-gray-400 dark:text-white/40">Easy on the eyes</p>
              </div>
              {theme === 'dark' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                  <Check className="h-3 w-3 text-black" />
                </div>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-white/30 text-center">Current theme: <span className="font-semibold text-brand capitalize">{theme}</span> · Preference is saved in your browser</p>
        </div>

        {/* Account */}
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
                {badge ? (
                  <span className="rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold capitalize text-brand">{value}</span>
                ) : (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workshop Info */}
        <div className="card">
          <SectionHeader icon={Building2} title="Workshop Info" subtitle="Business details" />
          <div className="space-y-3">
            {[
              { label: 'Workshop Name', value: 'AutoEdge Pro' },
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

        {/* Change Password */}
        <div className="card">
          <SectionHeader icon={Lock} title="Change Password" subtitle="Update your account password" />
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={pwForm.current}
                  onChange={e => setPw('current', e.target.value)}
                  placeholder="Enter current password"
                  className="input-base pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNext ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={pwForm.next}
                  onChange={e => setPw('next', e.target.value)}
                  placeholder="Min 6 characters"
                  className="input-base pr-10"
                />
                <button type="button" onClick={() => setShowNext(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60">
                  {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={pwForm.confirm}
                  onChange={e => setPw('confirm', e.target.value)}
                  placeholder="Re-enter new password"
                  className="input-base pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                : pwSuccess
                  ? <><Check className="h-4 w-4" /> Password Changed!</>
                  : 'Change Password'
              }
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
