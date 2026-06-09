'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { JOB_STATUS_STEP, type JobStatus } from '@/types'
import { formatAED, formatDate } from '@/lib/utils/format'
import {
  Search, Sun, Moon, Car, User, Calendar, Check, Loader2,
  MessageCircle, ExternalLink, ArrowLeft, X, Star, Send, Quote,
  FileText, MapPin, Clock, Wrench, Package, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useT } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  received:    { label: 'Received',     color: 'text-blue-600 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-500/10',     border: 'border-blue-200 dark:border-blue-500/20',     dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress',  color: 'text-orange-600 dark:text-brand',      bg: 'bg-orange-50 dark:bg-brand/10',      border: 'border-orange-200 dark:border-brand/20',      dot: 'bg-brand' },
  qc_check:    { label: 'Quality Check',color: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', dot: 'bg-purple-500' },
  ready:       { label: 'Ready',        color: 'text-emerald-600 dark:text-emerald-300',bg: 'bg-emerald-50 dark:bg-emerald-500/10',border: 'border-emerald-200 dark:border-emerald-500/20',dot: 'bg-emerald-500' },
  delivered:   { label: 'Delivered',    color: 'text-gray-500 dark:text-gray-400',     bg: 'bg-gray-50 dark:bg-white/[0.04]',    border: 'border-gray-200 dark:border-white/10',        dot: 'bg-gray-400' },
  cancelled:   { label: 'Cancelled',    color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-500/10',       border: 'border-red-200 dark:border-red-500/20',       dot: 'bg-red-500' },
}

const ANNOUNCEMENT_STYLE: Record<string, string> = {
  promo:   'bg-gradient-to-r from-brand to-orange-400 text-black border-orange-300',
  info:    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'bakkah_session_id'
  let id = localStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
          className="transition-all hover:scale-110 active:scale-95">
          <Star className={cn('h-8 w-8 transition-colors drop-shadow-sm',
            i <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-white/15')} />
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
  const { t } = useT()
  const tr = t.track
  const autoSearched = useRef(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [reviews, setReviews] = useState<ApprovedFeedback[]>([])

  const [fbRating, setFbRating] = useState(0)
  const [fbComment, setFbComment] = useState('')
  const [fbName, setFbName] = useState('')
  const [fbSubmitting, setFbSubmitting] = useState(false)
  const [fbDone, setFbDone] = useState(false)

  const logEvent = useCallback(async (eventType: string, extra?: { job_number?: string; query_type?: string }) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType, session_id: getOrCreateSessionId(), ...extra }),
      })
    } catch { /* fire-and-forget */ }
  }, [])

  useEffect(() => {
    logEvent('page_view')
    async function loadAnnouncements() {
      try {
        const sb = createClient()
        const now = new Date().toISOString()
        const { data } = await sb.from('announcements').select('id, title, content, type')
          .eq('active', true).eq('show_on_track', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`).order('created_at', { ascending: false })
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
  }, [logEvent])

  useEffect(() => {
    if (autoSearched.current) return
    const jobParam = new URLSearchParams(window.location.search).get('job')
    if (jobParam) {
      autoSearched.current = true
      setQuery(jobParam)
      runSearch(jobParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runSearch(q: string) {
    if (!q.trim()) return
    setLoading(true); setError(''); setResult(null); setSearched(true)
    setFbDone(false); setFbRating(0); setFbComment('')
    const queryType = q.toUpperCase().startsWith('JC-') ? 'job_number' : 'phone'
    logEvent('track_search', { query_type: queryType })
    try {
      const sb = createClient()
      const select = `id, job_number, status, date_in, date_out, total,
        customer:customers(name, phone),
        vehicle:vehicles(plate_number, make, model, color, year),
        services:job_card_services(id, description, total_price),
        parts:job_card_parts(id, part_name, quantity, unit_price, total_price)`
      let data: TrackResult | null = null
      if (queryType === 'job_number') {
        const { data: rows, error: err } = await sb.from('job_cards').select(select).ilike('job_number', q).limit(1).single()
        if (err && err.code !== 'PGRST116') throw err
        data = rows as TrackResult | null
      } else {
        const { data: customers } = await sb.from('customers').select('id').ilike('phone', `%${q.replace(/\s+/g, '')}%`).limit(5)
        if (customers && customers.length > 0) {
          const ids = customers.map((c: { id: string }) => c.id)
          const { data: rows } = await sb.from('job_cards').select(select).in('customer_id', ids).order('created_at', { ascending: false }).limit(1).single()
          data = rows as TrackResult | null
        }
      }
      if (!data) {
        logEvent('track_not_found', { query_type: queryType })
        setError(tr.errors.notFound)
      } else {
        logEvent('track_found', { job_number: data.job_number, query_type: queryType })
        setResult(data)
        setFbName(data.customer?.name ?? '')
        if (localStorage.getItem(`fb_${data.job_number}`)) setFbDone(true)
      }
    } catch { setError(tr.errors.generic) }
    finally { setLoading(false) }
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    runSearch(query.trim())
  }

  async function handleFeedbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!result || fbRating === 0) return
    setFbSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: result.id, job_number: result.job_number, customer_name: fbName || result.customer?.name || 'Customer', rating: fbRating, comment: fbComment || null }),
      })
      if (!res.ok) throw new Error()
      logEvent('feedback_submit', { job_number: result.job_number })
      setFbDone(true)
      localStorage.setItem(`fb_${result.job_number}`, '1')
    } catch { /* silent */ }
    finally { setFbSubmitting(false) }
  }

  function reset() {
    setResult(null); setError(''); setSearched(false); setQuery('')
    setFbDone(false); setFbRating(0); setFbComment('')
  }

  const curStep = result ? (JOB_STATUS_STEP[result.status] ?? 0) : 0
  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))
  const showFeedback = result?.status === 'delivered'
  const statusCfg = result ? (STATUS_CONFIG[result.status] ?? STATUS_CONFIG.received) : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 transition-colors duration-300">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-surface-900/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7F0A] shadow-[0_0_16px_rgba(255,127,10,0.4)] group-hover:shadow-[0_0_24px_rgba(255,127,10,0.55)] transition-all duration-300">
              <Car className="h-[18px] w-[18px] text-black" />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg tracking-[0.2em] text-gray-900 leading-none dark:text-white">BAKKAH</p>
              <p className="text-[9px] tracking-[0.12em] text-gray-400 dark:text-white/30">AUTO DETAILING</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="website" />
            <button onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a href="https://wa.me/971589397610" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/15">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <Link href="/auth/login" className="hidden text-xs text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 sm:block">
              {tr.staffLogin}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">

        {/* ── Announcements ──────────────────────────────── */}
        {visibleAnnouncements.length > 0 && (
          <div className="mb-5 space-y-2">
            {visibleAnnouncements.map(a => (
              <div key={a.id} className={cn('relative flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-sm', ANNOUNCEMENT_STYLE[a.type] ?? ANNOUNCEMENT_STYLE.info)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{a.content}</p>
                </div>
                <button onClick={() => setDismissedIds(prev => new Set([...prev, a.id]))} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Hero ───────────────────────────────────────── */}
        {!searched && (
          <div className="mb-8 text-center">
            <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-brand/20 bg-gradient-to-br from-brand/15 to-brand/5 shadow-[0_0_40px_rgba(255,127,10,0.12)]">
              <Car className="h-10 w-10 text-brand" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-gray-900 dark:text-white mb-3">
              {tr.hero.title}
            </h1>
            <p className="text-base text-gray-500 dark:text-white/50 max-w-sm mx-auto leading-relaxed">{tr.hero.subtitle}</p>

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/invoice" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-brand/30 hover:text-brand transition-all duration-200 shadow-sm dark:bg-white/[0.04] dark:border-white/10 dark:text-white/60 dark:hover:border-brand/30 dark:hover:text-brand">
                <FileText className="h-4 w-4" /> View Invoice
              </Link>
              <a href="https://wa.me/971589397610" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-100 transition-all duration-200 shadow-sm dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                <MessageCircle className="h-4 w-4" /> Contact Us
              </a>
            </div>
          </div>
        )}

        {/* ── Search form ────────────────────────────────── */}
        <form onSubmit={handleSearch} className="card-elevated mb-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-white/70 mb-3">{tr.search.label}</p>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={tr.search.placeholder}
                className="input-base pl-10"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()} className="btn-primary px-5 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : tr.search.btn}
            </button>
          </div>
          <p className="mt-2.5 text-xs text-gray-400 dark:text-white/30 leading-relaxed">
            {tr.search.hint} <span className="font-mono font-bold text-brand">JC-</span> {tr.search.hint2}
          </p>
        </form>

        {/* ── Error ──────────────────────────────────────── */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
            <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <X className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── Results ────────────────────────────────────── */}
        {result && statusCfg && (
          <div className="space-y-4">

            {/* Job summary card */}
            <div className="card-elevated overflow-hidden">
              {/* Colored top strip by status */}
              <div className={cn('h-1.5 -mx-5 -mt-5 mb-5 rounded-t-2xl', statusCfg.dot)} />

              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                    <span className="font-mono text-xl font-black text-brand tracking-wider">{result.job_number}</span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', statusCfg.color, statusCfg.bg, statusCfg.border)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {result.vehicle?.make} {result.vehicle?.model} &middot; <span className="font-mono font-bold text-gray-700 dark:text-white/70">{result.vehicle?.plate_number}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-brand">{formatAED(result.total)}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{tr.result.totalAmount}</p>
                </div>
              </div>

              {/* Status stepper — desktop */}
              {result.status !== 'cancelled' && (
                <div className="mb-5">
                  {/* Desktop */}
                  <div className="hidden sm:block">
                    <div className="relative">
                      {/* Progress bar background */}
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 dark:bg-white/[0.06]" />
                      {/* Progress bar fill */}
                      <div
                        className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-brand to-orange-400 status-progress"
                        style={{ width: `calc(${(curStep / (STEPS.length - 1)) * 100}% - 2rem)` }}
                      />
                      <div className="relative flex justify-between">
                        {STEPS.map((step, i) => {
                          const done = i < curStep
                          const active = i === curStep
                          return (
                            <div key={step} className="flex flex-col items-center gap-2">
                              <div className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500',
                                done   ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' :
                                active ? 'border-brand bg-brand text-black shadow-[0_0_16px_rgba(255,127,10,0.4)]' :
                                         'border-gray-200 bg-white text-gray-300 dark:border-white/15 dark:bg-surface-800 dark:text-white/20'
                              )}>
                                {done ? <Check className="h-4 w-4" /> : i + 1}
                              </div>
                              <span className={cn('text-[10px] font-semibold whitespace-nowrap',
                                active ? 'text-brand' : done ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-300 dark:text-white/25'
                              )}>{(tr.status as Record<string, string>)[step] ?? step}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mobile stepper */}
                  <div className="sm:hidden">
                    <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', statusCfg.bg, statusCfg.border)}>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full font-black text-sm shrink-0', statusCfg.dot === 'bg-brand' ? 'bg-brand text-black' : `${statusCfg.dot} text-white`)}>
                        {curStep + 1}
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', statusCfg.color)}>
                          {(tr.status as Record<string, string>)[result.status] ?? result.status}
                        </p>
                        {curStep < STEPS.length - 1 && (
                          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                            Next: {(tr.status as Record<string, string>)[STEPS[curStep + 1]] ?? STEPS[curStep + 1]}
                          </p>
                        )}
                      </div>
                      <div className="ml-auto flex gap-1">
                        {STEPS.map((_, i) => (
                          <div key={i} className={cn('h-1.5 w-5 rounded-full transition-all', i < curStep ? 'bg-emerald-500' : i === curStep ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10')} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-sm border-t border-gray-100 dark:border-white/[0.05] pt-4">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
                  <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-white/30" />
                  <span>{tr.result.dateIn}: <strong className="text-gray-800 dark:text-white/80">{formatDate(result.date_in)}</strong></span>
                </div>
                {result.date_out && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-white/50">
                    <Calendar className="h-3.5 w-3.5 text-brand" />
                    <span>{tr.result.expected}: <strong className="text-gray-800 dark:text-white/80">{formatDate(result.date_out)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle & Customer */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 dark:bg-brand/15">
                    <Car className="h-4 w-4 text-brand" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tr.result.vehicleLabel}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-white/40">{tr.result.plate}</span>
                    <span className="font-mono font-black text-gray-900 dark:text-white tracking-wider text-base">{result.vehicle?.plate_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-white/40">{tr.result.vehicle}</span>
                    <span className="text-gray-700 dark:text-white/70 font-medium">{result.vehicle?.make} {result.vehicle?.model} {result.vehicle?.year}</span>
                  </div>
                  {result.vehicle?.color && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 dark:text-white/40">{tr.result.color}</span>
                      <span className="text-gray-700 dark:text-white/70">{result.vehicle.color}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tr.result.customer}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-white/40">{tr.result.name}</span>
                    <span className="text-gray-700 dark:text-white/70 font-semibold">{result.customer?.name}</span>
                  </div>
                  {result.customer?.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 dark:text-white/40">Phone</span>
                      <span className="font-mono text-gray-700 dark:text-white/70">{result.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Services & Parts */}
            {((result.services && result.services.length > 0) || (result.parts && result.parts.length > 0)) && (
              <div className="card">
                {result.services && result.services.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
                        <Wrench className="h-4 w-4 text-purple-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tr.result.services}</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                      {result.services.map((s, i) => (
                        <div key={s.id} className={cn('flex items-center justify-between py-2 text-sm', i < result.services!.length - 1 && 'border-b border-gray-50 dark:border-white/[0.04]')}>
                          <span className="text-gray-600 dark:text-white/60 flex-1 pr-4">{s.description}</span>
                          <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatAED(s.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {result.parts && result.parts.length > 0 && (
                  <>
                    {result.services && result.services.length > 0 && <div className="border-t border-gray-100 dark:border-white/[0.06] my-4" />}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                        <Package className="h-4 w-4 text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tr.result.parts}</h3>
                    </div>
                    <div className="space-y-2 mb-4">
                      {result.parts.map((p, i) => (
                        <div key={p.id} className={cn('flex items-center justify-between py-2 text-sm', i < result.parts!.length - 1 && 'border-b border-gray-50 dark:border-white/[0.04]')}>
                          <span className="text-gray-600 dark:text-white/60 flex-1 pr-4">{p.part_name} <span className="text-gray-400 dark:text-white/30">&times;{p.quantity}</span></span>
                          <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatAED(p.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="border-t-2 border-gray-900 dark:border-white/20 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">{tr.result.total}</span>
                  <span className="font-black text-xl text-brand">{formatAED(result.total)}</span>
                </div>
              </div>
            )}

            {/* Feedback — delivered jobs only */}
            {showFeedback && (
              <div className="card border-brand/20 dark:border-brand/15">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tr.feedback.title}</h3>
                </div>

                {fbDone ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/15">
                      <Check className="h-7 w-7 text-emerald-500" />
                    </div>
                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">{tr.feedback.thanks}</p>
                    <p className="text-sm text-gray-500 dark:text-white/40">{tr.feedback.thanksMsg}</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="label mb-2">{tr.feedback.rating}</label>
                      <StarPicker value={fbRating} onChange={setFbRating} />
                    </div>
                    <div>
                      <label className="label">{tr.feedback.yourName}</label>
                      <input value={fbName} onChange={e => setFbName(e.target.value)} className="input-base" placeholder={tr.feedback.namePlaceholder} />
                    </div>
                    <div>
                      <label className="label">{tr.feedback.comment}</label>
                      <textarea value={fbComment} onChange={e => setFbComment(e.target.value)}
                        className="input-base min-h-[90px] resize-none" placeholder={tr.feedback.commentPlaceholder} rows={3} />
                    </div>
                    <button type="submit" disabled={fbSubmitting || fbRating === 0} className="btn-primary w-full py-3">
                      {fbSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {tr.feedback.submit}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href={`/invoice/${result.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-brand/20 bg-brand/5 px-4 py-3.5 text-sm font-bold text-brand hover:bg-brand/10 hover:border-brand/30 transition-all duration-200 dark:bg-brand/10 dark:border-brand/20 dark:hover:bg-brand/15">
                <ExternalLink className="h-4 w-4" />
                {tr.actions.viewInvoice}
              </a>
              <a href={`https://wa.me/971589397610?text=Hi+Bakkah%2C+I+want+to+follow+up+on+job+${encodeURIComponent(result.job_number)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-600 transition-all duration-200 shadow-[0_2px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.35)]">
                <MessageCircle className="h-4 w-4" />
                {tr.actions.contact}
              </a>
            </div>

            <button onClick={reset} className="flex w-full items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 py-2">
              <ArrowLeft className="h-3.5 w-3.5" /> {tr.actions.trackAnother}
            </button>
          </div>
        )}

        {/* ── Customer Reviews ───────────────────────────── */}
        {!searched && reviews.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-2 mb-6">
              <Quote className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-white/30">{tr.reviews.title}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id} className="card-hover space-y-3">
                  <StarRow rating={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed line-clamp-3">&ldquo;{r.comment}&rdquo;</p>
                  )}
                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-xs font-black text-brand shrink-0">
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700 dark:text-white/60">{r.customer_name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/25">Verified Customer</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-surface-800 p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand shadow-[0_0_12px_rgba(255,127,10,0.3)]">
              <Car className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="font-display tracking-[0.2em] text-gray-700 dark:text-white/70 text-sm">BAKKAH</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-white/25">
            <MapPin className="h-3 w-3" />
            <span>{tr.footer.location}</span>
          </div>
          <a href="https://wa.me/971589397610" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition">
            <MessageCircle className="h-3.5 w-3.5" /> +971 58 939 7610
          </a>
        </div>

        {/* Nav links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-white/25">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-white/50 transition-colors flex items-center gap-1">
            <ChevronRight className="h-3 w-3 rotate-180" /> Home
          </Link>
          <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
          <Link href="/invoice" className="hover:text-brand transition-colors flex items-center gap-1">
            <FileText className="h-3 w-3" /> View Invoice
          </Link>
          <span className="h-3 w-px bg-gray-200 dark:bg-white/10" />
          <Link href="/auth/login" className="hover:text-gray-600 dark:hover:text-white/50 transition-colors">
            Staff Login
          </Link>
        </div>
      </main>
    </div>
  )
}
