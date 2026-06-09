'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, User, Building2, Lock, Loader2, Check, Eye, EyeOff, Shield, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
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
  const [rtaConfig, setRtaConfig] = useState<{ moi_configured: boolean; dubai_police_configured: boolean; rta_configured: boolean } | null>(null)

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  useEffect(() => {
    fetch('/api/rta/config').then(r => r.json()).then(setRtaConfig).catch(() => {})
  }, [])

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
              className={`flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${theme === 'light'
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
              className={`flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${theme === 'dark'
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

        {/* UAE RTA Integration */}
        <div className="card">
          <SectionHeader
            icon={Shield}
            title="UAE RTA Integration"
            subtitle="Connect to government APIs to check vehicle fines, Salik, and registration"
          />

          <div className="space-y-3 mb-5">
            {[
              {
                key: 'moi_configured' as const,
                name: 'MOI Smart Services',
                desc: 'Federal traffic fines across all emirates',
                envVars: 'RTA_MOI_API_KEY, RTA_MOI_BASE_URL',
                url: 'https://smartservices.moi.gov.ae/developer',
              },
              {
                key: 'dubai_police_configured' as const,
                name: 'Dubai Police API',
                desc: 'Dubai traffic fines (OAuth2)',
                envVars: 'RTA_DP_CLIENT_ID, RTA_DP_CLIENT_SECRET, RTA_DP_BASE_URL',
                url: 'https://smart.dubaipolice.gov.ae/developer',
              },
              {
                key: 'rta_configured' as const,
                name: 'RTA Smart Integration',
                desc: 'Mulkiya, insurance, inspection, Salik balance',
                envVars: 'RTA_API_KEY, RTA_BASE_URL',
                url: 'https://gateway.rta.ae/',
              },
            ].map(src => {
              const configured = rtaConfig?.[src.key] ?? false
              return (
                <div key={src.key} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <div className="mt-0.5 shrink-0">
                    {configured
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <AlertCircle className="h-5 w-5 text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{src.name}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${configured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {configured ? 'Configured' : 'Not configured'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">{src.desc}</p>
                    <p className="text-[10px] font-mono text-gray-400 dark:text-white/30 mt-1">Env: {src.envVars}</p>
                  </div>
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-gray-300 hover:text-brand transition-colors dark:text-white/20 dark:hover:text-brand">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )
            })}
          </div>

          {!rtaConfig?.moi_configured && !rtaConfig?.dubai_police_configured && !rtaConfig?.rta_configured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:bg-amber-500/10 dark:border-amber-500/20">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">No APIs configured — using manual mode</p>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                You can still log vehicle fines, Salik, registration, insurance, and inspection data manually from each job card.
                To enable automatic lookups, add the environment variables listed above to your <code className="font-mono bg-amber-100 dark:bg-amber-500/20 px-1 rounded">.env.local</code> file.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:bg-blue-500/[0.06] dark:border-blue-500/20">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">How to get API access</p>
            <ol className="text-xs text-blue-600 dark:text-blue-400/80 space-y-1 list-decimal list-inside leading-relaxed">
              <li><strong>MOI:</strong> Register at smartservices.moi.gov.ae → Developer Portal → apply for Traffic Fines API</li>
              <li><strong>Dubai Police:</strong> Visit smart.dubaipolice.gov.ae → APIs → request OAuth2 client credentials</li>
              <li><strong>RTA:</strong> Email integration@rta.ae with your business TRN and use case for Smart Integration Platform access</li>
            </ol>
            <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-2">Approval takes 5–15 business days. All three are optional — configure only the sources you need.</p>
            <Link href="/workshop/rta-guide" className="mt-3 flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
              View full RTA API guide <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
