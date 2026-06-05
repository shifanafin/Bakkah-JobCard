'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { JOB_STATUS_LABEL, JOB_STATUS_STEP, type JobStatus } from '@/types'
import { formatAED, formatDate } from '@/lib/utils/format'
import {
  Search, Zap, Sun, Moon, Car, User, Calendar, Check, Loader2,
  MessageCircle, ExternalLink, ArrowLeft, X, Star, Send, Quote
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type TrackResult = {
  id: string
  job_number: string
  status: JobStatus
  date_in: string
  date_out?: string
  total: number
  customer?: { name: string; phone?: string }
  vehicle?: { plate_number: string; make: string; model: string; color?: string; year?: number }
  services?: { id: string; description: string; total_price: number }[]
  parts?: { id: string; part_name: string; quantity: number; unit_price: number; total_price: number }[]
}

type Announcement = {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'promo'
}

type ApprovedFeedback = {
  id: string
  customer_name: string
  rating: number
  comment: string | null
  created_at: string
}

const STEPS: JobStatus[] = ['received', 'in_progress', 'qc_check', 'ready', 'delivered']

const STATUS_COLOR: Record<string, string> = {
  received:    'bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-300 dark:border-blue-500/25',
  in_progress: 'bg-brand/10 text-brand border-brand/20',
  qc_check:    'bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-300 dark:border-purple-500/25',
  ready:       'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-300 dark:border-emerald-500/25',
  delivered:   'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/25',
  cancelled:   'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-500/25',
}

const ANNOUNCEMENT_STYLE: Record<string, string> = {
  promo:   'bg-orange-500 text-white border-orange-600',
  info:    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25',
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={cn(
            'h-7 w-7 transition-colors',
            i <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-white/20'
          )} />
        </button>
      ))}
    </div>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn('h-3.5 w-3.5', i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-white/10')} />
      ))}
    </div>
  )
}

export default function TrackPage() {
  const { theme, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [reviews, setReviews] = useState<ApprovedFeedback[]>([])

  // Feedback form state
  const [fbRating, setFbRating] = useState(0)
  const [fbComment, setFbComment] = useState('')
  const [fbName, setFbName] = useState('')
  const [fbSubmitting, setFbSubmitting] = useState(false)
  const [fbDone, setFbDone] = useState(false)

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const sb = createClient()
        const now = new Date().toISOString()
        const { data } = await sb
          .from('announcements')
          .select('id, title, content, type')
          .eq('active', true)
          .eq('show_on_track', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('created_at', { ascending: false })
        setAnnouncements((data ?? []) as Announcement[])
      } catch { /* silent */ }
    }

    async function loadReviews() {
      try {
        const res = await fetch('/api/feedback?approved=true')
        if (!res.ok) return
        const json = await res.json()
        setReviews(json.feedback ?? [])
      } catch { /* silent */ }
    }

    loadAnnouncements()
    loadReviews()
  }, [])

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError('')
    setResult(null)
    setSearched(true)
    setFbDone(false)
    setFbRating(0)
    setFbComment('')

    try {
      const sb = createClient()
      const select = `id, job_number, status, date_in, date_out, total,
        customer:customers(name, phone),
        vehicle:vehicles(plate_number, make, model, color, year),
        services:job_card_services(id, description, total_price),
        parts:job_card_parts(id, part_name, quantity, unit_price, total_price)`

      let data: TrackResult | null = null

      if (q.toUpperCase().startsWith('JC-')) {
        const { data: rows, error: err } = await sb
          .from('job_cards').select(select).ilike('job_number', q).limit(1).single()
        if (err && err.code !== 'PGRST116') throw err
        data = rows as TrackResult | null
      } else {
        const { data: customers } = await sb
          .from('customers').select('id').ilike('phone', `%${q.replace(/\s+/g, '')}%`).limit(5)
        if (customers && customers.length > 0) {
          const ids = customers.map((c: { id: string }) => c.id)
          const { data: rows } = await sb
            .from('job_cards').select(select).in('customer_id', ids)
            .order('created_at', { ascending: false }).limit(1).single()
          data = rows as TrackResult | null
        }
      }

      if (!data) {
        setError('No job found. Please check your job number or phone number and try again.')
      } else {
        setResult(data)
        setFbName(data.customer?.name ?? '')
        // Check if feedback already submitted for this job
        const key = `fb_${data.job_number}`
        if (localStorage.getItem(key)) setFbDone(true)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!result || fbRating === 0) return
    setFbSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_card_id: result.id,
          job_number: result.job_number,
          customer_name: fbName || result.customer?.name || 'Customer',
          rating: fbRating,
          comment: fbComment || null,
        }),
      })
      if (!res.ok) throw new Error()
      setFbDone(true)
      localStorage.setItem(`fb_${result.job_number}`, '1')
    } catch {
      // silent — don't block the user
    } finally {
      setFbSubmitting(false)
    }
  }

  function reset() {
    setResult(null)
    setError('')
    setSearched(false)
    setQuery('')
    setFbDone(false)
    setFbRating(0)
    setFbComment('')
  }

  const curStep = result ? (JOB_STATUS_STEP[result.status] ?? 0) : 0
  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))
  const showFeedback = result?.status === 'delivered'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-white/[0.06] dark:bg-surface-900/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
              <Zap className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-display text-lg leading-none tracking-wide text-gray-900 dark:text-white">AutoEdge Pro</p>
              <p className="text-[10px] text-gray-400 dark:text-white/30">Job Status Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/auth/login" className="hidden text-xs text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 sm:block">
              Staff Login →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">

        {/* Announcements */}
        {visibleAnnouncements.length > 0 && (
          <div className="mb-6 space-y-2">
            {visibleAnnouncements.map(a => (
              <div key={a.id} className={cn('relative flex items-start gap-3 rounded-xl border px-4 py-3', ANNOUNCEMENT_STYLE[a.type] ?? ANNOUNCEMENT_STYLE.info)}>
                <div className="flex-1">
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{a.content}</p>
                </div>
                <button onClick={() => setDismissedIds(prev => new Set([...prev, a.id]))} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hero */}
        {!searched && (
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/15 to-brand/5">
              <Car className="h-8 w-8 text-brand" />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-gray-900 dark:text-white">Track Your Vehicle</h1>
            <p className="mt-2 text-gray-500 dark:text-white/50">Enter your job number or phone number to check your vehicle's service status</p>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="card mb-6">
          <label className="label mb-1">Job Number or Phone Number</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. JC-2026-0001 or +971 50 123 4567"
                className="input-base w-full pl-9"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-white/30">
            Job numbers start with <span className="font-mono font-bold text-brand">JC-</span> · Or enter the phone number used at check-in
          </p>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Job summary */}
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-mono text-lg font-bold text-brand">{result.job_number}</span>
                    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_COLOR[result.status])}>
                      {JOB_STATUS_LABEL[result.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {result.vehicle?.make} {result.vehicle?.model} · {result.vehicle?.plate_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand">{formatAED(result.total)}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">Total Amount</p>
                </div>
              </div>

              {/* Status stepper */}
              {result.status !== 'cancelled' && (
                <div className="mb-4">
                  <div className="hidden sm:flex items-center">
                    {STEPS.map((step, i) => {
                      const done = i < curStep
                      const active = i === curStep
                      return (
                        <div key={step} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                              done  ? 'border-emerald-500 bg-emerald-500 text-white' :
                              active ? 'border-brand bg-brand text-black' :
                                       'border-gray-200 bg-gray-100 text-gray-300 dark:border-white/15 dark:bg-white/5 dark:text-white/30'
                            )}>
                              {done ? <Check className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className={cn('mt-1.5 text-[10px] font-semibold whitespace-nowrap',
                              active ? 'text-brand' : done ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-300 dark:text-white/30'
                            )}>{JOB_STATUS_LABEL[step]}</span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={cn('flex-1 h-0.5 mx-2 rounded-full', i < curStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10')} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {/* Mobile stepper */}
                  <div className="sm:hidden flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/[0.04]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-black font-bold">
                      {curStep + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{JOB_STATUS_LABEL[result.status]}</p>
                      {curStep < STEPS.length - 1 && (
                        <p className="text-xs text-gray-400 dark:text-white/40">Next: {JOB_STATUS_LABEL[STEPS[curStep + 1]]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-white/50">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date In: <strong className="text-gray-900 dark:text-white">{formatDate(result.date_in)}</strong></span>
                </div>
                {result.date_out && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-white/50">
                    <Calendar className="h-3.5 w-3.5 text-brand" />
                    <span>Expected: <strong className="text-gray-900 dark:text-white">{formatDate(result.date_out)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle & Customer */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="card space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Vehicle</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-white/40">Plate</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{result.vehicle?.plate_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-white/40">Vehicle</span>
                    <span className="text-gray-700 dark:text-white/70">{result.vehicle?.make} {result.vehicle?.model} {result.vehicle?.year}</span>
                  </div>
                  {result.vehicle?.color && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-white/40">Color</span>
                      <span className="text-gray-700 dark:text-white/70">{result.vehicle.color}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="card space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Customer</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-white/40">Name</span>
                    <span className="text-gray-700 font-medium dark:text-white/70">{result.customer?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            {result.services && result.services.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-bold text-gray-900 mb-3 dark:text-white">Services</h3>
                <div className="space-y-2">
                  {result.services.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-white/60">{s.description}</span>
                      <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatAED(s.total_price)}</span>
                    </div>
                  ))}
                </div>
                {result.parts && result.parts.length > 0 && (
                  <>
                    <div className="my-3 border-t border-gray-100 dark:border-white/[0.06]" />
                    <h3 className="text-sm font-bold text-gray-900 mb-3 dark:text-white">Parts</h3>
                    <div className="space-y-2">
                      {result.parts.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-white/60">{p.part_name} ×{p.quantity}</span>
                          <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatAED(p.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-3 border-t border-gray-100 pt-3 flex justify-between dark:border-white/[0.06]">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-lg text-brand">{formatAED(result.total)}</span>
                </div>
              </div>
            )}

            {/* Feedback form — only for delivered jobs */}
            {showFeedback && (
              <div className="card border-brand/20">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">How was your experience?</h3>
                </div>

                {fbDone ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 mb-3">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Thank you for your feedback!</p>
                    <p className="text-xs text-gray-400 mt-1 dark:text-white/30">Your review will be published after our team reviews it.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="label mb-2">Your Rating *</label>
                      <StarPicker value={fbRating} onChange={setFbRating} />
                    </div>
                    <div>
                      <label className="label mb-1">Your Name</label>
                      <input
                        value={fbName}
                        onChange={e => setFbName(e.target.value)}
                        className="input-base w-full"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="label mb-1">Comment (optional)</label>
                      <textarea
                        value={fbComment}
                        onChange={e => setFbComment(e.target.value)}
                        className="input-base w-full min-h-[80px] resize-none"
                        placeholder="Tell us about your experience..."
                        rows={3}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={fbSubmitting || fbRating === 0}
                      className="btn-primary w-full"
                    >
                      {fbSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`/workshop/job-cards/${result.id}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand/30 hover:text-brand dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-brand/30 dark:hover:text-brand"
              >
                <ExternalLink className="h-4 w-4" />
                View Invoice
              </a>
              <a
                href={`https://wa.me/971589397610?text=Hi+AutoEdge+Pro%2C+I+want+to+follow+up+on+job+${encodeURIComponent(result.job_number)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <MessageCircle className="h-4 w-4" />
                Contact AutoEdge Pro
              </a>
            </div>

            {/* Track another */}
            <button onClick={reset} className="flex w-full items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 mt-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Track Another Job
            </button>
          </div>
        )}

        {/* Customer Reviews section (approved feedback) */}
        {!searched && reviews.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-5">
              <Quote className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">What Our Customers Say</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id} className="card space-y-2.5">
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed line-clamp-3">&ldquo;{r.comment}&rdquo;</p>
                  )}
                  <p className="text-xs font-semibold text-gray-700 dark:text-white/60">{r.customer_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-400 dark:text-white/20 space-y-1">
          <p>AutoEdge Pro · Al Qusais, Dubai, UAE</p>
          <a
            href="https://wa.me/971589397610"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 transition font-medium"
          >
            <MessageCircle className="h-3 w-3" /> +971 58 939 7610
          </a>
        </div>
      </main>
    </div>
  )
}
